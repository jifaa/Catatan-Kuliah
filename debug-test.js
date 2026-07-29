const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const material = db.prepare("SELECT content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();
if (material) {
  const parsed = JSON.parse(material.content);
  const textNode = parsed.content[0].content[0];
  const str = textNode.text;

  console.log('1. str includes doc:', str.includes('"type":"doc"'));
  console.log('2. docStart:', str.indexOf('{"type":"doc"'));

  // Calculate missing structures
  let openBraces = 0, openBrackets = 0;
  let inString = false, escaped = false;
  const partial = str.substring(str.indexOf('{"type":"doc"'));

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

  console.log('3. Missing braces:', openBraces);
  console.log('4. Missing brackets:', openBrackets);

  // Try with manual fix
  let fixed = partial;
  for (let i = 0; i < openBraces; i++) fixed += '}';
  for (let i = 0; i < openBrackets; i++) fixed += ']';

  console.log('5. Fixed length:', fixed.length);
  console.log('6. Original length:', partial.length);

  try {
    const p = JSON.parse(fixed);
    console.log('7. Parse success! Content count:', p.content.length);
  } catch (e) {
    console.log('7. Parse failed:', e.message);
  }
}

db.close();