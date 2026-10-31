import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { marked } from "marked";

const MD =
  /^(#{1,6} |[-*+] |\d+\. |> |```|\|.+\|)|\*\*[^*\n]+\*\*|\[[^\]]+\]\([^)]+\)/m;

/** Plain-text paste that looks like Markdown becomes real formatting. Rich (HTML) pastes are left to the editor. */
export const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste(_view, event) {
            const data = event.clipboardData;
            if (!data || data.types.includes("text/html")) return false;
            const text = data.getData("text/plain");
            if (!MD.test(text)) return false;
            editor.commands.insertContent(
              marked.parse(text, { gfm: true, async: false }) as string,
            );
            return true;
          },
        },
      }),
    ];
  },
});
