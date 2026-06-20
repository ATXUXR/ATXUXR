"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: 8,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("bold")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("bold") ? "var(--primary-50)" : "transparent",
            cursor: "pointer",
            color: editor.isActive("bold") ? "var(--primary)" : "var(--fg)",
          }}
          title="Bold"
        >
          <Icon name="bold" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("italic")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("italic") ? "var(--primary-50)" : "transparent",
            cursor: "pointer",
            color: editor.isActive("italic") ? "var(--primary)" : "var(--fg)",
          }}
          title="Italic"
        >
          <Icon name="italic" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("strike")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("strike") ? "var(--primary-50)" : "transparent",
            cursor: "pointer",
            color: editor.isActive("strike") ? "var(--primary)" : "var(--fg)",
          }}
          title="Strikethrough"
        >
          <Icon name="strikethrough" size={14} />
        </button>

        <div
          style={{
            width: 1,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("heading", { level: 1 })
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("heading", { level: 1 })
              ? "var(--primary-50)"
              : "transparent",
            cursor: "pointer",
            color: editor.isActive("heading", { level: 1 })
              ? "var(--primary)"
              : "var(--fg)",
          }}
          title="Heading 1"
        >
          H1
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("heading", { level: 2 })
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("heading", { level: 2 })
              ? "var(--primary-50)"
              : "transparent",
            cursor: "pointer",
            color: editor.isActive("heading", { level: 2 })
              ? "var(--primary)"
              : "var(--fg)",
          }}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("bulletList")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("bulletList") ? "var(--primary-50)" : "transparent",
            cursor: "pointer",
            color: editor.isActive("bulletList") ? "var(--primary)" : "var(--fg)",
          }}
          title="Bullet list"
        >
          <Icon name="list" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("orderedList")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("orderedList")
              ? "var(--primary-50)"
              : "transparent",
            cursor: "pointer",
            color: editor.isActive("orderedList") ? "var(--primary)" : "var(--fg)",
          }}
          title="Ordered list"
        >
          <Icon name="list-ordered" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("blockquote")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("blockquote")
              ? "var(--primary-50)"
              : "transparent",
            cursor: "pointer",
            color: editor.isActive("blockquote") ? "var(--primary)" : "var(--fg)",
          }}
          title="Blockquote"
        >
          <Icon name="quote" size={14} />
        </button>

        <div
          style={{
            width: 1,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        <button
          onClick={() => editor.chain().focus().setLink({ href: prompt("URL") || "" }).run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: editor.isActive("link")
              ? "2px solid var(--primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: editor.isActive("link") ? "var(--primary-50)" : "transparent",
            cursor: "pointer",
            color: editor.isActive("link") ? "var(--primary)" : "var(--fg)",
          }}
          title="Add link"
        >
          <Icon name="link" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: editor.isActive("link") ? "pointer" : "not-allowed",
            opacity: editor.isActive("link") ? 1 : 0.5,
            color: "var(--fg)",
          }}
          title="Remove link"
        >
          <Icon name="link-off" size={14} />
        </button>

        <div
          style={{
            width: 1,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: editor.can().undo() ? "pointer" : "not-allowed",
            opacity: editor.can().undo() ? 1 : 0.5,
            color: "var(--fg)",
          }}
          title="Undo"
        >
          <Icon name="undo" size={14} />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: editor.can().redo() ? "pointer" : "not-allowed",
            opacity: editor.can().redo() ? 1 : 0.5,
            color: "var(--fg)",
          }}
          title="Redo"
        >
          <Icon name="redo" size={14} />
        </button>
      </div>

      {/* Editor */}
      <div
        style={{
          minHeight: 400,
          maxHeight: 600,
          overflowY: "auto",
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            padding: 16,
            fontSize: 14,
            lineHeight: 1.8,
            color: "var(--fg)",
          }}
        />
      </div>
    </div>
  );
}
