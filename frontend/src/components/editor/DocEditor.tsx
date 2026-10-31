import { EditorContent, useEditor } from "@tiptap/react";
import { buildExtensions } from "./extensions";
import Toolbar from "./Toolbar";

interface Props {
  html: string;
  onChange: (html: string) => void;
}

export default function DocEditor({ html, onChange }: Props) {
  const editor = useEditor({
    extensions: buildExtensions(
      "Start typing. Try # for a heading, - for a list, or **bold**.",
    ),
    content: html,
    editorProps: {
      attributes: { class: "doc-content doc-edit", "aria-label": "Document" },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;
  const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 px-5 py-8 sm:px-12 sm:py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-[760px]">
          <EditorContent editor={editor} />
        </div>
      </div>
      <p className="mt-2 text-right text-xs text-zinc-500">{words} words</p>
    </div>
  );
}
