"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useRef, useState, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TEXT_COLORS = [
  { name: "Default", value: "inherit" },
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#6B7280" },
  { name: "Red", value: "#DC2626" },
  { name: "Blue", value: "#2563EB" },
  { name: "Green", value: "#16A34A" },
  { name: "Purple", value: "#7C3AED" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content...",
  minHeight = 500,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [colorDropdown, setColorDropdown] = useState(false);

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
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rich-editor-image",
          style: "max-width: 100%; height: auto; border-radius: var(--radius-md); margin: 8px 0;",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content when value prop changes
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);

    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoInsert = () => {
    const url = prompt("Enter video URL (YouTube, Vimeo, or direct link):");
    if (!url) return;

    // For YouTube/Vimeo, embed iframe
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("/").pop()
        : new URL(url).searchParams.get("v");
      editor
        .chain()
        .focus()
        .insertContent(
          `<iframe style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-md); margin: 8px 0;" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        )
        .run();
    } else {
      // Assume it's a direct video URL
      editor
        .chain()
        .focus()
        .insertContent(
          `<video style="width: 100%; max-width: 100%; border-radius: var(--radius-md); margin: 8px 0;" controls><source src="${url}" type="video/mp4"></video>`
        )
        .run();
    }
  };

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
        {/* Text formatting */}
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

        {/* Divider */}
        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

        {/* Color picker */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setColorDropdown(!colorDropdown)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--fg)",
              background: "transparent",
            }}
            title="Text color"
          >
            <Icon name="palette" size={14} />
          </button>
          {colorDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 8,
                marginTop: 4,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 4,
              }}
            >
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                    setColorDropdown(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    background:
                      editor.isActive("textStyle", { color: color.value })
                        ? color.value
                        : "var(--bg)",
                    color: color.value === "#000000" ? "white" : "var(--fg)",
                  }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

        {/* Headings */}
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

        {/* Lists */}
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

        {/* Quote */}
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

        {/* Divider line */}
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--fg)",
          }}
          title="Insert divider line"
        >
          <Icon name="minus" size={14} />
        </button>

        {/* Link */}
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

        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

        {/* Image */}
        <button
          onClick={() => imageInputRef.current?.click()}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--fg)",
          }}
          title="Insert image"
        >
          <Icon name="image" size={14} />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {/* Video */}
        <button
          onClick={handleVideoInsert}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--fg)",
          }}
          title="Insert video (YouTube/Vimeo URL)"
        >
          <Icon name="video" size={14} />
        </button>

        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

        {/* Undo/Redo */}
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
          minHeight,
          background: "var(--bg)",
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            padding: 16,
            minHeight: "100%",
            fontSize: 14,
            lineHeight: 1.8,
            color: "white",
            outline: "none",
            backgroundColor: "var(--bg)",
          }}
        />
        <style>{`
          .ProseMirror {
            color: white !important;
            background: var(--bg) !important;
            min-height: ${minHeight}px;
          }
          .ProseMirror p {
            color: white !important;
          }
        `}</style>
      </div>
    </div>
  );
}
