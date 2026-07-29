const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const material = db.prepare("SELECT content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();
if (material) {
  const parsed = JSON.parse(material.content);
  const textNode = parsed.content[0].content[0];
  const str = textNode.text;

  // The ending shows nested structure. Let's try to find the last complete object
  // by looking for pattern },"content":[

  let lastCompleteObjEnd = -1;
  const searchPattern = '},{"type":"';

  // Search backwards from the end
  for (let i = str.length - 1; i >= 0; i--) {
    if (str.substring(i, i + searchPattern.length) === searchPattern) {
      lastCompleteObjEnd = i + 1; // after the }
      break;
    }
  }

  console.log('Last complete object ends at:', lastCompleteObjEnd);

  if (lastCompleteObjEnd > 0) {
    // Try truncating at that point and adding closing brackets
    const truncated = str.substring(0, lastCompleteObjEnd);

    // Count and close brackets
    let openBraces = 0, openBrackets = 0;
    for (const c of truncated) {
      if (c === '{') openBraces++;
      else if (c === '}') openBraces--;
      else if (c === '[') openBrackets++;
      else if (c === ']') openBrackets--;
    }

    let fixed = truncated;
    for (let i = 0; i < openBraces; i++) fixed += '}';
    for (let i = 0; i < openBrackets; i++) fixed += ']';

    try {
      const p = JSON.parse(fixed);
      console.log('Partial parse success! Content count:', p.content ? p.content.length : 0);
      if (p.content) {
        console.log('First few items:');
        p.content.slice(0, 3).forEach((item, i) => {
          console.log('  [' + i + '] type:', item.type);
        });
      }
    } catch (e) {
      console.log('Partial parse failed:', e.message);
    }
  }
}

db.close();