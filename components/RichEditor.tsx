"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarBtn({
  active,
  onClick,
  icon,
  label,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  icon?: string;
  label?: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: 34,
        height: 34,
        padding: "0 8px",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        border: "none",
        background: active ? "var(--orange-50)" : "transparent",
        color: active ? "var(--orange-700)" : "var(--fg-muted)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {icon ? <Icon name={icon} size={17} /> : label}
    </button>
  );
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "atx-prose",
        style: "min-height: 280px; padding: 22px 24px; outline: none; font-size: 17px;",
        "data-placeholder": placeholder || "",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Keep external resets in sync (e.g. "Write another" wipes state).
  useEffect(() => {
    if (!editor) return;
    if (value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.setContent("");
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 280,
          border: "1.5px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
        }}
      />
    );
  }

  const setLink = () => {
    const url = window.prompt("Link URL");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      style={{
        border: "1.5px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "6px 8px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          flexWrap: "wrap",
        }}
      >
        <ToolbarBtn
          title="Heading 2"
          label="H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarBtn
          title="Heading 3"
          label="H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <span
          style={{
            width: 1,
            height: 20,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />
        <ToolbarBtn
          title="Bold"
          icon="bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarBtn
          title="Italic"
          icon="italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <span
          style={{
            width: 1,
            height: 20,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />
        <ToolbarBtn
          title="Bulleted list"
          icon="list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarBtn
          title="Numbered list"
          icon="list-ordered"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarBtn
          title="Quote"
          icon="quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarBtn title="Link" icon="link" onClick={setLink} />
        <span
          style={{
            width: 1,
            height: 20,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />
        <ToolbarBtn
          title="Normal paragraph"
          label="Normal"
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
