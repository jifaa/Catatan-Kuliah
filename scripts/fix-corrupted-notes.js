/**
 * Script untuk memperbaiki konten catatan yang rusak.
 *
 * Masalah: Beberapa konten catatan tersimpan sebagai JSON TipTap yang malformed,
 * dengan bulletList tersarang di dalam paragraph.content atau text node berisi JSON stringified.
 *
 * Contoh struktur rusak:
 * {"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[
 *   {"type":"text","text":"Tujuan Penelitian:"},
 *   {"type":"bulletList","content":[...]}  // <-- Salah! bulletList harus sibling, bukan child
 * ]}]}
 *
 * Struktur yang benar:
 * {"type":"doc","content":[
 *   {"type":"paragraph","content":[{"type":"text","text":"Tujuan Penelitian:"}]},
 *   {"type":"bulletList","content":[...]}
 * ]}
 */

const { PrismaClient } = require("../app/generated/prisma/client");

const prisma = new PrismaClient();

// Block elements yang harus menjadi sibling paragraph, bukan child
const BLOCK_ELEMENTS = new Set([
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "heading",
  "taskList",
  "taskItem",
]);

// Inline elements yang valid di dalam paragraph.content
const INLINE_ELEMENTS = new Set(["text", "hardBreak"]);

/**
 * Parse JSON dengan handle double-encoded
 */
function parseJson(str) {
  if (!str || typeof str !== "string") return null;
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === "string") {
      try {
        return JSON.parse(parsed);
      } catch {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Fix malformed TipTap JSON
 */
function fixTiptapJson(doc) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) {
    return null; // Return null untuk menandai perlu perbaikan
  }

  const newContent = [];

  for (const node of doc.content) {
    if (!node || typeof node !== "object") {
      newContent.push(node);
      continue;
    }

    if (node.type === "paragraph") {
      const inlineContent = [];
      const blockContent = [];
      const extractedBlocks = [];

      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (!child || typeof child !== "object") {
            inlineContent.push(child);
            continue;
          }

          if (INLINE_ELEMENTS.has(child.type)) {
            inlineContent.push(child);
          } else if (BLOCK_ELEMENTS.has(child.type)) {
            blockContent.push(child);
          } else if (child.type === "text" && child.text) {
            // Check if text contains double-encoded JSON
            const innerDoc = parseJson(child.text);
            if (innerDoc && innerDoc.type === "doc" && Array.isArray(innerDoc.content)) {
              extractedBlocks.push(...innerDoc.content);
            } else {
              inlineContent.push(child);
            }
          } else {
            inlineContent.push(child);
          }
        }
      }

      // Only add paragraph if it has content
      if (inlineContent.length > 0) {
        newContent.push({ ...node, content: inlineContent });
      }

      // Add block elements as siblings
      for (const block of blockContent) {
        newContent.push(block);
      }

      // Add extracted blocks from text nodes
      for (const block of extractedBlocks) {
        newContent.push(block);
      }
    } else if (["bulletList", "orderedList", "taskList"].includes(node.type)) {
      // Recursively fix list content
      if (node.content) {
        const fixedNode = fixTiptapJson({ type: "container", content: node.content });
        if (fixedNode) {
          newContent.push({ ...node, content: fixedNode.content });
        } else {
          newContent.push(node);
        }
      } else {
        newContent.push(node);
      }
    } else if (node.content) {
      // Recursively fix nested content
      const fixed = fixTiptapJson(node);
      if (fixed) {
        newContent.push(fixed);
      } else {
        newContent.push(node);
      }
    } else {
      newContent.push(node);
    }
  }

  return { ...doc, content: newContent };
}

/**
 * Check if content needs fixing
 */
function needsFixing(doc) {
  if (!doc || !Array.isArray(doc.content)) return false;

  for (const node of doc.content) {
    if (node && node.type === "paragraph" && Array.isArray(node.content)) {
      for (const child of node.content) {
        if (child && typeof child === "object" && BLOCK_ELEMENTS.has(child.type)) {
          return true;
        }
        // Check for double-encoded JSON in text
        if (child && child.type === "text" && child.text) {
          try {
            JSON.parse(child.text);
            return true; // Text yang bisa di-parse JSON perlu diperiks
          } catch {}
        }
      }
    }
  }
  return false;
}

async function main() {
  console.log("🔍 Memulai perbaikan konten catatan...\n");

  let totalFixed = 0;
  let totalErrors = 0;

  // Fix SubjectNote
  console.log("📝 Memperbaiki SubjectNote...");
  const subjectNotes = await prisma.subjectNote.findMany({
    where: {
      content: {
        not: "",
      },
    },
  });

  for (const note of subjectNotes) {
    try {
      const parsed = parseJson(note.content);
      if (parsed && needsFixing(parsed)) {
        const fixed = fixTiptapJson(parsed);
        if (fixed) {
          await prisma.subjectNote.update({
            where: { id: note.id },
            data: { content: JSON.stringify(fixed) },
          });
          totalFixed++;
          console.log(`  ✅ Perbaikan: ${note.title || note.id}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error pada ${note.id}: ${error.message}`);
      totalErrors++;
    }
  }

  // Fix Material
  console.log("\n📚 Memperbaiki Material...");
  const materials = await prisma.material.findMany({
    where: {
      content: {
        not: "",
      },
    },
  });

  for (const material of materials) {
    try {
      const parsed = parseJson(material.content);
      if (parsed && needsFixing(parsed)) {
        const fixed = fixTiptapJson(parsed);
        if (fixed) {
          await prisma.material.update({
            where: { id: material.id },
            data: { content: JSON.stringify(fixed) },
          });
          totalFixed++;
          console.log(`  ✅ Perbaikan: ${material.title || material.id}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error pada ${material.id}: ${error.message}`);
      totalErrors++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Hasil perbaikan:`);
  console.log(`   ✅ Berhasil diperbaiki: ${totalFixed} records`);
  console.log(`   ❌ Gagal: ${totalErrors} records`);
  console.log("=".repeat(50));

  if (totalFixed === 0 && totalErrors === 0) {
    console.log("\n✨ Tidak ada konten yang perlu diperbaiki!");
  }
}

main()
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });