const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const material = db.prepare("SELECT content FROM Material WHERE id = 'cmmbkqfgs00011kklgszajrx8'").get();
if (material) {
  const parsed = JSON.parse(material.content);
  const textNode = parsed.content[0].content[0];
  const str = textNode.text;

  console.log('Total length:', str.length);
  console.log('');

  // Try to find valid JSON structure
  // Look for patterns that indicate complete objects
  let lastValidPos = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === '{') braceDepth++;
    else if (c === '}') braceDepth--;
    else if (c === '[') bracketDepth++;
    else if (c === ']') bracketDepth--;
  }

  console.log('Opening { found:', (str.match(/\{/g) || []).length);
  console.log('Closing } found:', (str.match(/\}/g) || []).length);
  console.log('Opening [ found:', (str.match(/\[/g) || []).length);
  console.log('Closing ] found:', (str.match(/\]/g) || []).length);
  console.log('');

  // The last part ends with }]}]}]}
  // Let's count how many times ]}] appears at the end
  const ending = str.substring(str.length - 20);
  console.log('Last 20 chars:', ending);

  // Count trailing }] patterns
  let trailing = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    const sub = str.substring(i);
    if (sub.startsWith('}]') || sub.startsWith('}')) {
      trailing++;
      i--;
    } else {
      break;
    }
  }
  console.log('Trailing }] count:', trailing);

  // Try closing with additional brackets
  let fixed = str;
  const extraCloses = [1, 2, 3, 4, 5, 6];
  for (const n of extraCloses) {
    let test = str;
    for (let i = 0; i < n; i++) test += '}]}';
    try {
      const p = JSON.parse(test);
      console.log(`With ${n} extra }]} sequences: SUCCESS`);
      console.log('Content count:', p.content.length);
      break;
    } catch (e) {
      console.log(`With ${n} extra }]} sequences: FAILED`);
    }
  }
}

db.close();