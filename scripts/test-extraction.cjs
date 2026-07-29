const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

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

function parseJsonSafe(str) {
  if (!str || typeof str !== "string") return null;
  try {
    let parsed = JSON.parse(str);
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch {}
    }
    return parsed;
  } catch { return null; }
}

function extractJsonFromTextNode(str) {
  if (typeof str !== "string" || !str.includes('"type":"doc"')) return null;

  try {
    const parsed = JSON.parse(str);
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {}

  const docStart = str.indexOf('{"type":"doc"');
  if (docStart === -1) return null;

  const partial = str.substring(docStart);
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

        if (child.type === "text" && typeof child.text === "string") {
          if (child.text === '{"type":"doc","content":[]}') {
            continue;
          }

          const innerDoc = extractJsonFromTextNode(child.text);
          if (innerDoc && innerDoc.content) {
            console.log('    -> Extracted inner doc with', innerDoc.content.length, 'nodes');
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

// Test on cmmbkqfgs00011kklgszajrx8
const material = db.prepare("SELECT id, content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();

if (material) {
  console.log('Testing material:', material.id);
  console.log('');

  const parsed = parseJsonSafe(material.content);
  console.log('Parsed outer doc:', parsed ? 'yes' : 'no');
  console.log('Parsed type:', parsed && parsed.type);

  if (parsed && parsed.content) {
    console.log('Content items:', parsed.content.length);

    const firstPara = parsed.content[0];
    console.log('First item type:', firstPara && firstPara.type);

    if (firstPara && firstPara.content) {
      console.log('First para content items:', firstPara.content.length);

      const textNode = firstPara.content[0];
      console.log('First para child type:', textNode && textNode.type);
      console.log('Text length:', textNode && textNode.text && textNode.text.length);

      if (textNode && textNode.text) {
        const hasEmbeddedJson = textNode.text.includes('"type":"doc"') ||
                               textNode.text.includes('"type":"paragraph"');
        console.log('Has embedded JSON markers:', hasEmbeddedJson);

        const innerDoc = extractJsonFromTextNode(textNode.text);
        console.log('extractJsonFromTextNode result:', innerDoc ? 'found' : 'null');
      }
    }
  }

  console.log('');
  console.log('Running fixDocument...');
  const fixed = fixDocument(parsed);
  console.log('Fixed content items:', fixed.content ? fixed.content.length : 0);
}

db.close();