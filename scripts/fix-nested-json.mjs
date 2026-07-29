/**
 * Script untuk memperbaiki struktur Tiptap JSON yang corrupted
 * pada table Material dan SubjectNote.
 *
 * Problem: Data yang di-export dari MySQL punya struktur nested listItem
 * yang tidak valid (truncated JSON).
 *
 * Solusi: Rekonstruksi struktur yang benar:
 * - bulletList harus langsung berisi listItem (sibling)
 * - listItem tidak boleh langsung di dalam listItem.content
 *
 * Usage: node scripts/fix-nested-json.mjs
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, "..", "prisma", "dev.db");
const databaseUrl = process.env.DATABASE_URL;

const dbPath = databaseUrl?.startsWith("file:")
  ? path.resolve(__dirname, "..", databaseUrl.slice(5))
  : defaultDbPath;

console.log("📂 Database:", dbPath);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// ---------------------------------------------------------------------------
// Helper: parse JSON safely
// ---------------------------------------------------------------------------

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: Extract text from corrupted inner doc
// ---------------------------------------------------------------------------

/**
 * Extract paragraph texts from the inner (corrupted) content.
 * Returns array of texts.
 */
function extractParagraphTexts(innerStr) {
  // Parse the truncated JSON partially
  // Find all text values by regex
  const texts = [];
  const regex = /"text":"([^"]*(?:\\.[^"]*)*)"/g;
  let match;
  while ((match = regex.exec(innerStr)) !== null) {
    let text = match[1];
    // Unescape
    text = text.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    texts.push(text);
  }
  return texts;
}

// ---------------------------------------------------------------------------
// Helper: Extract texts recursively from Tiptap node
// ---------------------------------------------------------------------------

function extractTexts(node) {
  if (!node || typeof node !== "object") return [];

  if (node.type === "text" && typeof node.text === "string") {
    return [node.text];
  }

  const results = [];
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      results.push(...extractTexts(child));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Helper: Reconstruct correct Tiptap bullet list
// ---------------------------------------------------------------------------

/**
 * Given texts that were incorrectly nested, reconstruct proper structure.
 *
 * Corrupt structure example:
 *   - listItem: "Menyelesaikan Masalah"
 *     - listItem: "Meningkatkan Keefektifan"
 *       - listItem: "Mengembangkan Teknologi"
 *
 * This means the texts should become sibling listItems:
 *   - bulletList:
 *     - listItem: "Menyelesaikan Masalah"
 *     - listItem: "Meningkatkan Keefektifan"
 *     - listItem: "Mengembangkan Teknologi"
 */
function reconstructBulletList(texts, startIdx) {
  if (startIdx >= texts.length) return { items: [], nextIdx: startIdx };

  const items = [];

  while (startIdx < texts.length) {
    const text = texts[startIdx];

    // Check if this text indicates a new list item (starts without indent)
    // or if it indicates a sub-item
    // For simplicity, treat each text as a list item
    const item = {
      type: "listItem",
      attrs: { textAlign: null },
      content: [{ type: "paragraph", attrs: { textAlign: null }, content: [{ type: "text", text }] }],
    };
    items.push(item);
    startIdx++;

    // Stop if next item looks like it should be at different level
    // (but since structure is lost, we treat all as siblings for now)
  }

  return { items, nextIdx: startIdx };
}

// ---------------------------------------------------------------------------
// Full reconstruction based on specific corrupted patterns
// ---------------------------------------------------------------------------

/**
 * Reconstruct content from corrupted inner JSON.
 * Since the nesting structure is lost, we rebuild based on the text content.
 */
function reconstructFromCorrupted(innerStr) {
  // Extract all texts from the inner structure
  const texts = extractParagraphTexts(innerStr);

  if (texts.length === 0) return null;

  // Find where bullet list starts (usually after a label like "Tujuan Penelitian:")
  let bulletStartIdx = 0;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (t.includes(":") && !t.includes("?") && !t.includes("bagaimana")) {
      bulletStartIdx = i + 1;
      break;
    }
  }

  // Separate prefix texts from bullet list texts
  const prefixTexts = texts.slice(0, bulletStartIdx);
  const bulletTexts = texts.slice(bulletStartIdx);

  // Build document
  const doc = { type: "doc", content: [] };

  // Add prefix paragraphs
  for (const text of prefixTexts) {
    doc.content.push({
      type: "paragraph",
      attrs: { textAlign: null },
      content: [{ type: "text", text }],
    });
  }

  // Add bullet list if there are bullet texts
  if (bulletTexts.length > 0) {
    const bulletList = {
      type: "bulletList",
      content: bulletTexts.map((text) => ({
        type: "listItem",
        attrs: { textAlign: null },
        content: [
          {
            type: "paragraph",
            attrs: { textAlign: null },
            content: [{ type: "text", text }],
          },
        ],
      })),
    };
    doc.content.push(bulletList);
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Alternative: Fix nested structure by detecting depth from bracket nesting
// ---------------------------------------------------------------------------

/**
 * More sophisticated approach: parse the bracket structure to determine nesting depth.
 *
 * In the corrupt JSON:
 * - Each listItem has an opening `{` and closing `}`
 * - Nested listItem inside listItem has more `{` before the `listItem` type
 *
 * We can track bracket depth to determine which listItem should be sibling vs nested.
 */
function fixCorruptedJsonByDepth(innerStr) {
  // First, try to find the correct bracket boundaries
  // The issue is that listItem is nested inside another listItem incorrectly

  // Strategy: Track when we enter/exit listItem blocks
  // If we see `listItem` while already inside a listItem without an intervening bulletList,
  // this listItem should have been a sibling at the parent level

  const lines = [];
  let depth = 0;
  let inListItem = false;
  let listItemStack = [];

  // Simple state machine approach - track bracket depth changes
  let i = 0;
  const chars = innerStr.split("");

  // Find all listItem positions and their depth
  const listItemPositions = [];
  let bracketDepth = 0;
  let pos = 0;

  while (pos < chars.length) {
    const c = chars[pos];
    if (c === "{") bracketDepth++;
    else if (c === "}") bracketDepth--;
    else if (c === '"') {
      // Skip string
      pos++;
      while (pos < chars.length && chars[pos] !== '"') {
        if (chars[pos] === "\\") pos++;
        pos++;
      }
    } else {
      // Check for "listItem"
      if (pos + 9 < chars.length && innerStr.substring(pos, pos + 9) === '"listItem"') {
        listItemPositions.push({ pos, depth: bracketDepth });
        pos += 9;
        continue;
      }
    }
    pos++;
  }

  return listItemPositions;
}

// ---------------------------------------------------------------------------
// Main repair function
// ---------------------------------------------------------------------------

function repairMaterial(m) {
  const content = m.content;
  const outer = tryParseJson(content);

  if (!outer || outer.type !== "doc" || !Array.isArray(outer.content)) {
    return null;
  }

  const block = outer.content[0];
  if (block?.type !== "paragraph") return null;

  const textNode = block.content?.find((c) => c.type === "text" && typeof c.text === "string");
  if (!textNode) return null;

  // Try to parse the inner text
  const innerDoc = tryParseJson(textNode.text);
  if (innerDoc && innerDoc.type === "doc") {
    // Already valid JSON - just repair bullet list structure
    return repairBulletListStructure(innerDoc);
  }

  // Corrupted JSON - reconstruct from texts
  return reconstructFromCorrupted(textNode.text);
}

/**
 * Repair nested bullet list structure in a valid doc.
 * Detects listItem directly inside listItem.content and flattens.
 */
function repairBulletListStructure(doc) {
  if (!doc || !Array.isArray(doc.content)) return doc;

  let changed = true;
  let passes = 0;
  const MAX_PASSES = 5;

  while (changed && passes < MAX_PASSES) {
    changed = false;
    passes++;

    for (let i = 0; i < doc.content.length; i++) {
      const block = doc.content[i];

      if (block.type === "bulletList" || block.type === "orderedList") {
        const newItems = [];
        for (const item of block.content || []) {
          if (item.type === "listItem") {
            const processed = flattenNestedListItems(item);
            if (processed.length > 0) {
              newItems.push(...processed);
              changed = true;
            }
          } else {
            newItems.push(item);
          }
        }
        block.content = newItems;
      }
    }
  }

  return doc;
}

/**
 * Flatten nested listItems: listItem inside listItem.content -> sibling listItems.
 */
function flattenNestedListItems(listItem) {
  if (!listItem || listItem.type !== "listItem") return [listItem];

  const result = [];
  let pendingSublist = null;

  function processContent(content, isTopLevel) {
    if (!Array.isArray(content)) return;

    for (const child of content) {
      if (child.type === "paragraph" && Array.isArray(child.content)) {
        // Check for nested listItem in this paragraph
        const textParts = [];
        const subItems = [];

        for (const pChild of child.content) {
          if (pChild.type === "listItem") {
            subItems.push(pChild);
          } else if (pChild.type === "text") {
            textParts.push(pChild);
          } else {
            textParts.push(pChild);
          }
        }

        // Create paragraph with only text content
        if (textParts.length > 0 || subItems.length > 0) {
          const paragraph = {
            type: "paragraph",
            attrs: { textAlign: null },
            content: textParts,
          };

          // Create list item for this paragraph
          const item = {
            type: "listItem",
            attrs: { ...listItem.attrs },
            content: [paragraph],
          };

          // Process sub-items as siblings
          for (const subItem of subItems) {
            const flattened = flattenNestedListItems(subItem);
            result.push(...flattened);
          }

          result.push(item);
        }
      } else if (child.type === "bulletList" || child.type === "orderedList") {
        // Sub-list - wrap in a listItem
        const subListItem = {
          type: "listItem",
          attrs: { textAlign: null },
          content: [
            {
              type: "paragraph",
              attrs: { textAlign: null },
              content: [],
            },
            child,
          ],
        };
        result.push(subListItem);
      } else if (child.type === "listItem") {
        // Direct listItem child - flatten
        const flattened = flattenNestedListItems(child);
        result.push(...flattened);
      }
    }
  }

  processContent(listItem.content, true);

  // If nothing was extracted, create a simple list item
  if (result.length === 0) {
    result.push(listItem);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main: process Material table
// ---------------------------------------------------------------------------

console.log("\n🔧 Memperbaiki data Material...");

const materials = db
  .prepare("SELECT id, title, content FROM Material WHERE content IS NOT NULL AND content != ''")
  .all();

let fixedCount = 0;
let errorCount = 0;

const updateMaterial = db.prepare("UPDATE Material SET content = ? WHERE id = ?");

for (const m of materials) {
  try {
    const repaired = repairMaterial(m);
    if (repaired) {
      const newContent = JSON.stringify(repaired);
      if (newContent !== m.content) {
        updateMaterial.run(newContent, m.id);
        fixedCount++;
        console.log(`  ✅ Fixed: ${m.title || m.id}`);
      }
    }
  } catch (e) {
    errorCount++;
    console.log(`  ❌ Error: ${m.title || m.id} - ${e.message}`);
  }
}

console.log(`\n📊 Material fixed: ${fixedCount}, errors: ${errorCount}`);

// ---------------------------------------------------------------------------
// Process SubjectNote table
// ---------------------------------------------------------------------------

console.log("\n🔧 Memperbaiki data SubjectNote...");

const notes = db
  .prepare("SELECT id, title, content FROM SubjectNote WHERE content IS NOT NULL AND content != ''")
  .all();

let noteFixedCount = 0;
let noteErrorCount = 0;

const updateNote = db.prepare("UPDATE SubjectNote SET content = ? WHERE id = ?");

for (const n of notes) {
  try {
    const outer = tryParseJson(n.content);
    if (!outer || outer.type !== "doc") continue;

    const repaired = repairBulletListStructure(outer);
    const newContent = JSON.stringify(repaired);

    if (newContent !== n.content) {
      updateNote.run(newContent, n.id);
      noteFixedCount++;
      console.log(`  ✅ Fixed: ${n.title || n.id}`);
    }
  } catch (e) {
    noteErrorCount++;
    console.log(`  ❌ Error: ${n.title || n.id} - ${e.message}`);
  }
}

console.log(`\n📊 SubjectNote fixed: ${noteFixedCount}, errors: ${noteErrorCount}`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n✨ Selesai!");
console.log(`   Total Material fixed:    ${fixedCount}`);
console.log(`   Total SubjectNote fixed: ${noteFixedCount}`);

db.close();