import {
  Children,
  createElement,
  isValidElement,
  memo,
  useState,
  type ReactNode,
} from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { LuCheck, LuCopy } from "react-icons/lu";
import { cn } from "../../lib/cn";
import { normalizeContent } from "../../lib/markdown";

function CodeBlock({ language, text }: { language: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-xs text-zinc-500">{language || "text"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <LuCheck className="size-3.5" />
          ) : (
            <LuCopy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// react-markdown passes a `node` prop that must not reach the DOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const el =
  (tag: string, base: string) =>
  ({ node: _node, className, ...rest }: any) =>
    createElement(tag, { className: cn(base, className), ...rest });

const components: Components = {
  h1: el("h1", "mb-3 mt-6 text-xl font-semibold tracking-tight"),
  h2: el("h2", "mb-2 mt-6 text-lg font-semibold tracking-tight"),
  h3: el("h3", "mb-2 mt-5 text-base font-semibold"),
  h4: el("h4", "mb-1 mt-4 text-sm font-semibold"),
  p: el("p", "my-3"),
  ul: el("ul", "my-3 list-disc space-y-1 pl-6"),
  ol: el("ol", "my-3 list-decimal space-y-1 pl-6"),
  li: el("li", "pl-1"),
  strong: el("strong", "font-semibold"),
  blockquote: el(
    "blockquote",
    "my-3 border-l-2 border-zinc-300 pl-4 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
  ),
  hr: el("hr", "my-6 border-zinc-200 dark:border-zinc-800"),
  thead: el("thead", "bg-zinc-50 dark:bg-zinc-950"),
  tbody: el("tbody", "divide-y divide-zinc-200 dark:divide-zinc-800"),
  th: el(
    "th",
    "whitespace-nowrap border-b border-zinc-200 px-3 py-2 text-left font-medium dark:border-zinc-800",
  ),
  td: el("td", "px-3 py-2 align-top"),
  input: el("input", "mr-2 align-middle"),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="break-words font-medium underline underline-offset-4"
    >
      {children}
    </a>
  ),
  // images are blocked on purpose: show the alt text instead
  img: ({ alt }) => (
    <span className="text-zinc-500">{alt ? `[image: ${alt}]` : "[image]"}</span>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[0.9em] dark:bg-zinc-900">
      {children}
    </code>
  ),
  pre: ({ children }) => {
    const child = Children.toArray(children)[0];
    if (isValidElement(child)) {
      const props = child.props as { className?: string; children?: ReactNode };
      const language =
        /language-([\w-]+)/.exec(props.className ?? "")?.[1] ?? "";
      return (
        <CodeBlock
          language={language}
          text={String(props.children ?? "").replace(/\n$/, "")}
        />
      );
    }
    return <pre>{children}</pre>;
  },
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="min-w-0 break-words text-[15px] leading-7 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
      <Markdown
        remarkPlugins={[
          remarkGfm,
          [remarkMath, { singleDollarTextMath: false }],
        ]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={components}
      >
        {normalizeContent(content)}
      </Markdown>
    </div>
  );
}

export default memo(MarkdownContent);
