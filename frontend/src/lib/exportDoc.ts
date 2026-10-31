import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CSS = `body{font-family:Inter,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;color:#18181b}
h1,h2,h3{line-height:1.25} table{border-collapse:collapse;width:100%;margin:12px 0} th,td{border:1px solid #d4d4d8;padding:6px 10px;text-align:left}
pre{background:#f4f4f5;padding:12px;overflow:auto;border-radius:6px} code{font-family:Consolas,monospace} blockquote{border-left:3px solid #d4d4d8;margin:12px 0;padding-left:14px;color:#52525b}
ul{list-style:disc;padding-left:1.5em} ol{list-style:decimal;padding-left:1.5em}`;

export function documentHtml(title: string, html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body><h1>${esc(title)}</h1>${html}</body></html>`;
}

export function htmlToMarkdown(title: string, html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  td.use(gfm);
  return `# ${title}\n\n${td.turndown(html)}\n`;
}

export const safeFileName = (title: string) =>
  title
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "document";

export function downloadText(fileName: string, mime: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: `${mime};charset=utf-8` }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the print dialog; choose "Save as PDF" there. */
export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return frame.remove();
  doc.open();
  doc.write(html);
  doc.close();
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 2000);
  };
}

// import { createElement } from "react";
// import { renderToStaticMarkup } from "react-dom/server";
// import Markdown from "react-markdown";
// import remarkGfm from "remark-gfm";
//
// const esc = (s: string) =>
//   s
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;");
//
// const CSS = `body{font-family:Inter,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;color:#18181b}
// h1,h2,h3{line-height:1.25} table{border-collapse:collapse;margin:12px 0} th,td{border:1px solid #d4d4d8;padding:6px 10px;text-align:left}
// pre{background:#f4f4f5;padding:12px;overflow:auto;border-radius:6px} code{font-family:Consolas,monospace} blockquote{border-left:3px solid #d4d4d8;margin:12px 0;padding-left:14px;color:#52525b}`;
//
// export function documentHtml(title: string, markdown: string): string {
//   const body = renderToStaticMarkup(
//     createElement(Markdown, { remarkPlugins: [remarkGfm] }, markdown),
//   );
//   return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;
// }
//
// export const safeFileName = (title: string) =>
//   title
//     .replace(/[^\w\- ]+/g, "")
//     .trim()
//     .replace(/\s+/g, "-")
//     .slice(0, 60) || "document";
//
// export function downloadText(fileName: string, mime: string, content: string) {
//   const url = URL.createObjectURL(
//     new Blob([content], { type: `${mime};charset=utf-8` }),
//   );
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = fileName;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   setTimeout(() => URL.revokeObjectURL(url), 1000);
// }
//
// /** Opens the print dialog; choose "Save as PDF" there. */
// export function printHtml(html: string) {
//   const frame = document.createElement("iframe");
//   frame.style.cssText =
//     "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
//   document.body.appendChild(frame);
//   const doc = frame.contentDocument;
//   if (!doc) return frame.remove();
//   doc.open();
//   doc.write(html);
//   doc.close();
//   frame.onload = () => {
//     frame.contentWindow?.focus();
//     frame.contentWindow?.print();
//     setTimeout(() => frame.remove(), 2000);
//   };
// }
