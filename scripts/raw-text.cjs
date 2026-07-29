const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const material = db.prepare("SELECT content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();
if (material) {
  const parsed = JSON.parse(material.content);
  const textNode = parsed.content[0].content[0];
  const str = textNode.text;

  console.log('Raw text content (first 100 chars):');
  console.log(str.substring(0, 100));
  console.log('');
  console.log('Last 100 chars:');
  console.log(str.substring(str.length - 100));
  console.log('');
  console.log('Total length:', str.length);

  // Try direct parse
  try {
    const p = JSON.parse(str);
    console.log('Direct parse: SUCCESS');
    console.log('Content count:', p.content.length);
  } catch (e) {
    console.log('Direct parse: FAILED -', e.message);
  }
}

db.close();