import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  LuAlignCenter,
  LuAlignJustify,
  LuAlignLeft,
  LuAlignRight,
  LuBold,
  LuCode,
  LuEraser,
  LuHighlighter,
  LuItalic,
  LuLink,
  LuList,
  LuListOrdered,
  LuMinus,
  LuPalette,
  LuQuote,
  LuRedo2,
  LuStrikethrough,
  LuTable,
  LuUnderline,
  LuUndo2,
} from "react-icons/lu";
import { cn } from "../../lib/cn";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

const FONTS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "Inter, Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "Consolas, 'Courier New', monospace" },
];
const SIZES = [
  "",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
        active
          ? "bg-zinc-200 dark:bg-zinc-800"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => (
  <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
);
const select =
  "h-8 rounded-md border border-zinc-200 bg-transparent px-1.5 text-xs outline-none dark:border-zinc-800";

export default function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const c = () => editor.chain().focus();

  const block =
    [1, 2, 3].find((l) => editor.isActive("heading", { level: l })) ?? 0;
  const font =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? "";
  const size =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";

  const openLink = () => {
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const raw = url.trim();
    if (!raw) c().extendMarkRange("link").unsetLink().run();
    else {
      const href = /^(https?:\/\/|mailto:)/i.test(raw) ? raw : `https://${raw}`;
      c().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-0 z-20 -mx-1 border-b border-zinc-200 bg-white/95 px-1 py-1.5 backdrop-blur dark:border-zinc-800 dark:bg-black/95"
    >
      <div className="flex flex-wrap items-center gap-0.5">
        <Tool
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => c().undo().run()}
        >
          <LuUndo2 className="size-4" />
        </Tool>
        <Tool
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => c().redo().run()}
        >
          <LuRedo2 className="size-4" />
        </Tool>
        <Sep />
        <select
          aria-label="Text style"
          className={select}
          value={block}
          onChange={(e) => {
            const l = Number(e.target.value);
            if (l)
              c()
                .setHeading({ level: l as 1 | 2 | 3 })
                .run();
            else c().setParagraph().run();
          }}
        >
          <option value={0}>Paragraph</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
        <select
          aria-label="Font"
          className={cn(select, "w-20")}
          value={font}
          onChange={(e) =>
            e.target.value
              ? c().setFontFamily(e.target.value).run()
              : c().unsetFontFamily().run()
          }
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className={cn(select, "w-16")}
          value={size}
          onChange={(e) =>
            e.target.value
              ? c().setFontSize(e.target.value).run()
              : c().unsetFontSize().run()
          }
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace("px", "") : "Size"}
            </option>
          ))}
        </select>
        <Sep />
        <Tool
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => c().toggleBold().run()}
        >
          <LuBold className="size-4" />
        </Tool>
        <Tool
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => c().toggleItalic().run()}
        >
          <LuItalic className="size-4" />
        </Tool>
        <Tool
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => c().toggleUnderline().run()}
        >
          <LuUnderline className="size-4" />
        </Tool>
        <Tool
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => c().toggleStrike().run()}
        >
          <LuStrikethrough className="size-4" />
        </Tool>
        <label
          title="Text color"
          className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <LuPalette className="size-4" />
          <input
            type="color"
            aria-label="Text color"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => c().setColor(e.target.value).run()}
          />
        </label>
        <label
          title="Highlight"
          className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <LuHighlighter className="size-4" />
          <input
            type="color"
            aria-label="Highlight color"
            defaultValue="#fde68a"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => c().setHighlight({ color: e.target.value }).run()}
          />
        </label>
        <Sep />
        <Tool
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => c().setTextAlign("left").run()}
        >
          <LuAlignLeft className="size-4" />
        </Tool>
        <Tool
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => c().setTextAlign("center").run()}
        >
          <LuAlignCenter className="size-4" />
        </Tool>
        <Tool
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => c().setTextAlign("right").run()}
        >
          <LuAlignRight className="size-4" />
        </Tool>
        <Tool
          label="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => c().setTextAlign("justify").run()}
        >
          <LuAlignJustify className="size-4" />
        </Tool>
        <Sep />
        <Tool
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => c().toggleBulletList().run()}
        >
          <LuList className="size-4" />
        </Tool>
        <Tool
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => c().toggleOrderedList().run()}
        >
          <LuListOrdered className="size-4" />
        </Tool>
        <Tool
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => c().toggleBlockquote().run()}
        >
          <LuQuote className="size-4" />
        </Tool>
        <Tool
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => c().toggleCodeBlock().run()}
        >
          <LuCode className="size-4" />
        </Tool>
        <Tool label="Divider" onClick={() => c().setHorizontalRule().run()}>
          <LuMinus className="size-4" />
        </Tool>
        <Tool label="Link" active={editor.isActive("link")} onClick={openLink}>
          <LuLink className="size-4" />
        </Tool>
        <Tool
          label="Insert table"
          onClick={() =>
            c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <LuTable className="size-4" />
        </Tool>
        <Tool
          label="Clear formatting"
          onClick={() => c().unsetAllMarks().clearNodes().run()}
        >
          <LuEraser className="size-4" />
        </Tool>
      </div>

      {editor.isActive("table") && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
          <span className="px-1 text-zinc-500">Table</span>
          {[
            ["+ Row", () => c().addRowAfter().run()],
            ["+ Column", () => c().addColumnAfter().run()],
            ["− Row", () => c().deleteRow().run()],
            ["− Column", () => c().deleteColumn().run()],
            ["Delete table", () => c().deleteTable().run()],
          ].map(([label, run]) => (
            <button
              key={label as string}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={run as () => void}
              className="rounded-md border border-zinc-200 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link"
        footer={
          <>
            <Button onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyLink}>
              {url.trim() ? "Apply" : "Remove link"}
            </Button>
          </>
        }
      >
        <input
          autoFocus
          aria-label="Link address"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyLink()}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-transparent px-3.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100"
        />
      </Dialog>
    </div>
  );
}
