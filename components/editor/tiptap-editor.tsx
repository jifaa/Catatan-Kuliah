"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { extensions } from "./extensions";
import { MenuBar } from "./menu-bar";
import { cn } from "@/lib/utils";

// Block elements yang harus dipindahkan keluar dari paragraph.content
const BLOCK_ELEMENTS = new Set([
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "heading",
  "taskList",
  "taskItem",
  "image",
]);

// Inline elements yang valid di dalam paragraph.content
const INLINE_ELEMENTS = new Set(["text", "hardBreak"]);

/**
 * Cek apakah sebuah string adalah JSON TipTap yang bisa di-parse
 */
function tryParseJson(str: string): any {
  if (typeof str !== "string" || str.length < 10) return null;
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object" && (parsed.type === "doc" || parsed.type === "fragment")) {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      return { type: "doc", content: parsed };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract content dari inner JSON jika text node berisi JSON stringified
 */
function extractTextAsJson(textNode: any): any {
  if (!textNode || textNode.type !== "text" || !textNode.text) return null;
  return tryParseJson(textNode.text);
}

/**
 * Perbaiki struktur TipTap JSON yang malformed
 * Block elements yang seharusnya menjadi sibling paragraph,
 * kadang tersimpan di dalam paragraph.content
 * Handle juga double-encoded JSON dalam text nodes
 */
function cleanTiptapJson(doc: any): any {
  if (!doc || typeof doc !== "object" || !doc.content || !Array.isArray(doc.content)) {
    return doc;
  }

  const newContent: any[] = [];

  for (const node of doc.content) {
    if (node.type === "paragraph" && node.content) {
      const inlineContent: any[] = [];
      const blockContent: any[] = [];
      const innerDocBlocks: any[] = [];

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
          // Check if text content is double-encoded JSON
          const extracted = extractTextAsJson(child);
          if (extracted && extracted.content) {
            innerDocBlocks.push(...extracted.content);
            continue;
          }
          inlineContent.push(child);
        } else {
          inlineContent.push(child);
        }
      }

      if (inlineContent.length > 0) {
        newContent.push({ ...node, content: inlineContent });
      }

      for (const block of blockContent) {
        newContent.push(block);
      }

      for (const innerBlock of innerDocBlocks) {
        newContent.push(innerBlock);
      }
    } else if (node.type === "bulletList" || node.type === "orderedList" || node.type === "taskList") {
      if (node.content) {
        newContent.push({ ...node, content: cleanTiptapJson(node).content });
      } else {
        newContent.push(node);
      }
    } else if (node.content) {
      newContent.push(cleanTiptapJson(node));
    } else {
      newContent.push(node);
    }
  }

  return { ...doc, content: newContent };
}

interface TiptapEditorProps {
  content: string | Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  className?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  className,
  editable = true,
}: TiptapEditorProps) {
  const parsedContent = (() => {
    if (!content) return undefined;
    if (typeof content === 'object') return cleanTiptapJson(content);
    try {
      let parsed = JSON.parse(content);
      // Handle double-encoded JSON (data saved before fix)
      // If result is still a string, parse again
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // Fallback: use first parse result
        }
      }
      return cleanTiptapJson(parsed);
    } catch {
      // Fallback: treat as plain text if JSON parsing fails
      return content;
    }
  })();

  const editor = useEditor({
    extensions,
    content: parsedContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div
      className={cn(
        "tiptap-editor border border-border rounded-lg overflow-hidden bg-background",
        className
      )}
    >
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
