const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const materials = db.prepare("SELECT id, content FROM Material WHERE content LIKE '%bulletList%'").all();
console.log('Materials with bulletList:', materials.length);

for (const m of materials) {
  try {
    const parsed = JSON.parse(m.content);
    const textNode = parsed.content && parsed.content[0] && parsed.content[0].content && parsed.content[0].content[0];
    if (textNode && textNode.type === 'text' && textNode.text) {
      try {
        JSON.parse(textNode.text);
        console.log('  ' + m.id.substring(0,8) + ': Valid JSON in text node');
      } catch (e) {
        console.log('  ' + m.id.substring(0,8) + ': CORRUPTED JSON in text node (' + textNode.text.length + ' chars)');
      }
    } else {
      console.log('  ' + m.id.substring(0,8) + ': No text node in paragraph');
    }
  } catch (e) {
    console.log('  ' + m.id.substring(0,8) + ': Outer parse error');
  }
}

db.close();
