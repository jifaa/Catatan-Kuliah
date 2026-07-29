/**
 * Fix Script: Perbaiki struktur TipTap JSON yang malformed
 * Handle double-encoded JSON dan corrupted JSON dalam text nodes
 *
 * Usage: node scripts/fix-malformed-content.mjs
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Block elements
const BLOCK_ELEMENTS = new Set([
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "heading",
  "image",
  "taskList",
  "taskItem",
]);

// Inline elements
const INLINE_ELEMENTS = new Set(["text", "hardBreak"]);

/**
 * Parse JSON safely with double-encoding handling
 */
function parseJsonSafe(str) {
  if (!str || typeof str !== "string") return null;
  try {
    let parsed = JSON.parse(str);
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {}
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Try to extract JSON from a text node, handling truncated JSON
 */
function extractJsonFromTextNode(str) {
  if (typeof str !== "string" || !str.includes('"type":"doc"')) return null;

  // Try direct parse first
  try {
    const parsed = JSON.parse(str);
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {}

  // Find doc pattern start
  const docStart = str.indexOf('{"type":"doc"');
  if (docStart === -1) return null;

  const partial = str.substring(docStart);

  // Count unclosed structures
  let openBraces = 0, openBrackets = 0;
  let inString = false, escaped = false;

  for (let i = 0; i < partial.length; i++) {
    const c = partial[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === '{') openBraces++;
    else if (c === '}') openBraces--;
    else if (c === '[') openBrackets++;
    else if (c === ']') openBrackets--;
  }

  // Close unclosed structures
  let fixed = partial;
  for (let i = 0; i < openBraces; i++) fixed += '}';
  for (let i = 0; i < openBrackets; i++) fixed += ']';

  try {
    const parsed = JSON.parse(fixed);
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {}

  return null;
}

/**
 * Check if a text node contains embedded JSON that might be truncated
 */
function textNodeHasEmbeddedJson(textNode) {
  if (!textNode || textNode.type !== "text" || typeof textNode.text !== "string") {
    return false;
  }
  const text = textNode.text;
  // Check for signs of embedded JSON
  return text.includes('"type":"doc"') ||
         text.includes('"type":"paragraph"') ||
         text.includes('"type":"heading"') ||
         text.includes('"type":"bulletList"');
}

/**
 * Recursively fix document structure
 * Move block elements out of paragraph.content to doc level
 */
function fixDocument(doc) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) return doc;

  const newContent = [];

  for (const node of doc.content) {
    if (!node || typeof node !== "object") {
      newContent.push(node);
      continue;
    }

    if (node.type === "paragraph" && Array.isArray(node.content)) {
      const inlineContent = [];
      const blockContent = [];

      for (const child of node.content) {
        if (!child || typeof child !== "object") {
          inlineContent.push(child);
          continue;
        }

        // Check if text content is double-encoded or truncated JSON
        if (child.type === "text" && typeof child.text === "string") {
          // Skip the empty paragraph created by the outer structure
          if (child.text === '{"type":"doc","content":[]}' ||
              child.text === '{"type":"doc","content":[]}') {
            continue;
          }

          const innerDoc = extractJsonFromTextNode(child.text);
          if (innerDoc && innerDoc.content) {
            newContent.push(...fixDocument(innerDoc).content);
            continue;
          }
        }

        if (INLINE_ELEMENTS.has(child.type)) {
          inlineContent.push(child);
        } else if (BLOCK_ELEMENTS.has(child.type)) {
          blockContent.push(child);
        } else {
          inlineContent.push(child);
        }
      }

      if (inlineContent.length > 0) {
        newContent.push({ ...node, content: inlineContent });
      }

      newContent.push(...blockContent);
    } else if (node.content) {
      newContent.push(fixDocument(node));
    } else {
      newContent.push(node);
    }
  }

  return { ...doc, content: newContent };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "prisma", "dev.db");

console.log("📂 Database:", dbPath);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

let fixedCount = 0;
let extractedCount = 0;

// ---- Fix Materials ----
console.log("\n📝 Memperbaiki Materials...");

const materials = db.prepare("SELECT id, content FROM Material WHERE content IS NOT NULL").all();

for (const material of materials) {
  if (!material.content) continue;

  const parsed = parseJsonSafe(material.content);
  if (!parsed) continue;

  // Check if first paragraph has text node with embedded JSON
  const firstPara = parsed.content && parsed.content[0];
  const textNode = firstPara && firstPara.content && firstPara.content[0];

  // If text node contains embedded JSON (like "type":"doc"), try to extract
  if (textNode && textNodeHasEmbeddedJson(textNode)) {
    const innerDoc = extractJsonFromTextNode(textNode.text);
    if (innerDoc && innerDoc.content) {
      const fixed = fixDocument(innerDoc);
      const fixedJson = JSON.stringify(fixed);
      db.prepare("UPDATE Material SET content = ? WHERE id = ?").run(fixedJson, material.id);
      extractedCount++;
      console.log(`  ✅ Extracted: ${material.id.substring(0, 8)}...`);
      continue;
    }
  }

  // Regular fix for malformed block elements in paragraphs
  const fixed = fixDocument(parsed);
  const fixedJson = JSON.stringify(fixed);

  if (fixedJson !== material.content) {
    db.prepare("UPDATE Material SET content = ? WHERE id = ?").run(fixedJson, material.id);
    fixedCount++;
    console.log(`  ✅ Fixed: ${material.id.substring(0, 8)}...`);
  }
}

// ---- Fix SubjectNotes ----
console.log("\n📝 Memperbaiki SubjectNotes...");

const notes = db.prepare("SELECT id, content FROM SubjectNote WHERE content IS NOT NULL").all();

for (const note of notes) {
  if (!note.content) continue;

  const parsed = parseJsonSafe(note.content);
  if (!parsed) continue;

  // Check for embedded JSON in text nodes
  const firstPara = parsed.content && parsed.content[0];
  const textNode = firstPara && firstPara.content && firstPara.content[0];

  if (textNode && textNodeHasEmbeddedJson(textNode)) {
    const innerDoc = extractJsonFromTextNode(textNode.text);
    if (innerDoc && innerDoc.content) {
      const fixed = fixDocument(innerDoc);
      const fixedJson = JSON.stringify(fixed);
      db.prepare("UPDATE SubjectNote SET content = ? WHERE id = ?").run(fixedJson, note.id);
      extractedCount++;
      console.log(`  ✅ Extracted: ${note.id.substring(0, 8)}...`);
      continue;
    }
  }

  const fixed = fixDocument(parsed);
  const fixedJson = JSON.stringify(fixed);

  if (fixedJson !== note.content) {
    db.prepare("UPDATE SubjectNote SET content = ? WHERE id = ?").run(fixedJson, note.id);
    fixedCount++;
    console.log(`  ✅ Fixed: ${note.id.substring(0, 8)}...`);
  }
}

db.close();

console.log("\n✨ Perbaikan selesai!");
console.log(`   Data yang diperbaiki: ${fixedCount}`);
console.log(`   Data yang di-extract: ${extractedCount}`);

if (extractedCount > 0 || fixedCount > 0) {
  console.log("\n📌 Langkah selanjutnya:");
  console.log("   1. Jalankan 'npm run dev' untuk test");
  console.log("   2. Buka material/note yang sebelumnya bermasalah");
}