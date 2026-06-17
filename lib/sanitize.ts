import DOMPurify from "isomorphic-dompurify";

/**
 * Allowlist-sanitize a post body. Run on the server before writing to the DB.
 * Allows the tags emitted by the TipTap-based RichEditor: headings (h2/h3),
 * paragraphs, lists, blockquotes, inline emphasis, line breaks, and links.
 */
export function sanitizeBody(html: string): string {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: [
      "p",
      "br",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "strong",
      "em",
      "b",
      "i",
      "a",
    ],
    ALLOWED_ATTR: ["href", "title", "rel", "target"],
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|\/|#)/i,
  });
}
