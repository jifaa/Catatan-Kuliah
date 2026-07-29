// Test the example from user's message
const str = '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Tujuan Penelitian:"},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Menyelesaikan Masalah"},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Meningkatkan Keefektifan"},{"type":"listItem","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Mengembangkan Teknologi"}]}]}]},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Research: Kenapa?, Bagaimana?, Bagaimana jika?"},{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"Development: bagaimana cara kita mengimplementasikannya?"}]}]}]}]}';

console.log('String length:', str.length);

// Try direct parse
try {
  const p = JSON.parse(str);
  console.log('Direct parse success! Content count:', p.content ? p.content.length : 0);
  console.log('First item type:', p.content[0].type);
  console.log('First item has bulletList in content:', p.content[0].content.some(c => c.type === 'bulletList'));
} catch (e) {
  console.log('Direct parse failed:', e.message);
}

// Count structures
let openBraces = 0, openBrackets = 0;
let inString = false, escaped = false;
for (const c of str) {
  if (escaped) { escaped = false; continue; }
  if (c === '\\') { escaped = true; continue; }
  if (c === '"') { inString = !inString; continue; }
  if (inString) continue;
  if (c === '{') openBraces++;
  else if (c === '}') openBraces--;
  else if (c === '[') openBrackets++;
  else if (c === ']') openBrackets--;
}
console.log('Missing }:', openBraces);
console.log('Missing ]:', openBrackets);

// Try with closing
let fixed = str + '}'.repeat(openBraces) + ']'.repeat(openBrackets);
try {
  const p = JSON.parse(fixed);
  console.log('Fixed parse success!');
} catch (e) {
  console.log('Fixed parse failed:', e.message);
}