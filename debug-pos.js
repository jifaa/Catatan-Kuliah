const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const material = db.prepare("SELECT content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();
if (material) {
  const parsed = JSON.parse(material.content);
  const textNode = parsed.content[0].content[0];
  const str = textNode.text;

  console.log('Text length:', str.length);
  console.log('');

  // Show around position 852
  const pos = 852;
  const start = Math.max(0, pos - 50);
  const end = Math.min(str.length, pos + 50);
  console.log('Around position', pos, ':');
  console.log(str.substring(start, end));
  console.log('');
  console.log('After position', pos, ':');
  console.log(str.substring(pos, pos + 100));
}

db.close();