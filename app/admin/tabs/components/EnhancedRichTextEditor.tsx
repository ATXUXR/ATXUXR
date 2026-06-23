"use client";

import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder,
}: EnhancedRichTextEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div>
      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        <Btn
          variant={mode === "edit" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("edit")}
        >
          <Icon name="edit" size={14} style={{ marginRight: 4 }} />
          Edit
        </Btn>
        <Btn
          variant={mode === "preview" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("preview")}
        >
          <Icon name="eye" size={14} style={{ marginRight: 4 }} />
          Preview
        </Btn>
      </div>

      {/* Editor mode */}
      {mode === "edit" && (
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={400}
        />
      )}

      {/* Preview mode */}
      {mode === "preview" && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            minHeight: 400,
            background: "var(--bg)",
            fontSize: 14,
            lineHeight: 1.8,
            color: "var(--fg)",
            overflowY: "auto",
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: value || "<p>No content</p>" }} />
        </div>
      )}
    </div>
  );
}
