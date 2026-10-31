import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const mdToHtml = (md: string) =>
  marked.parse(md, { gfm: true, async: false }) as string;

const color = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i];

export function sanitizeDoc(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "a",
      "span",
      "mark",
      "sub",
      "sup",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      span: ["style"],
      mark: ["style", "data-color"],
      ol: ["start"],
    },
    allowedStyles: {
      "*": {
        color,
        "background-color": color,
        "text-align": [/^(left|right|center|justify)$/],
        "font-family": [/^[\w\s,"'-]+$/],
        "font-size": [/^\d+(\.\d+)?(px|pt|em|rem)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

export function htmlToText(html: string): string {
  const spaced = html.replace(
    /<\/(p|h[1-6]|li|tr|blockquote|pre)>|<br\s*\/?>/gi,
    "\n",
  );
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Always returns safe HTML, whatever the stored format is. */
export const docHtml = (content: string, format: "md" | "html") =>
  sanitizeDoc(format === "html" ? content : mdToHtml(content));
export const docText = (content: string, format: "md" | "html") =>
  format === "html" ? htmlToText(content) : content;
