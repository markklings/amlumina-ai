import { LuChevronDown, LuDownload } from "react-icons/lu";
import { useDisclosure } from "../../hooks/useDisclosure";
import { useDismiss } from "../../hooks/useDismiss";
import {
  documentHtml,
  downloadText,
  htmlToMarkdown,
  printHtml,
  safeFileName,
} from "../../lib/exportDoc";
import Button from "../ui/Button";

interface Props {
  title: string;
  html: string;
}

export default function ExportMenu({ title, html }: Props) {
  const { open, toggle, hide } = useDisclosure();
  const ref = useDismiss<HTMLDivElement>(open, hide);
  const name = safeFileName(title);

  const items = [
    {
      label: "Markdown (.md)",
      run: () =>
        downloadText(
          `${name}.md`,
          "text/markdown",
          htmlToMarkdown(title, html),
        ),
    },
    {
      label: "Web page (.html)",
      run: () =>
        downloadText(`${name}.html`, "text/html", documentHtml(title, html)),
    },
    {
      label: "Word (.doc)",
      run: () =>
        downloadText(
          `${name}.doc`,
          "application/msword",
          documentHtml(title, html),
        ),
    },
    {
      label: "PDF (print)",
      run: () => printHtml(documentHtml(title, html)),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <LuDownload className="size-3.5" />
        Export
        <LuChevronDown className="size-3.5" />
      </Button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
        >
          {items.map((i) => (
            <li key={i.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  i.run();
                  hide();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {i.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// import { LuChevronDown, LuDownload } from "react-icons/lu";
// import { useDisclosure } from "../../hooks/useDisclosure";
// import { useDismiss } from "../../hooks/useDismiss";
// import {
//   documentHtml,
//   downloadText,
//   printHtml,
//   safeFileName,
// } from "../../lib/exportDoc";
// import Button from "../ui/Button";
//
// interface Props {
//   title: string;
//   content: string;
// }
//
// export default function ExportMenu({ title, content }: Props) {
//   const { open, toggle, hide } = useDisclosure();
//   const ref = useDismiss<HTMLDivElement>(open, hide);
//   const name = safeFileName(title);
//
//   const items = [
//     {
//       label: "Markdown (.md)",
//       run: () =>
//         downloadText(`${name}.md`, "text/markdown", `# ${title}\n\n${content}`),
//     },
//     {
//       label: "Web page (.html)",
//       run: () =>
//         downloadText(`${name}.html`, "text/html", documentHtml(title, content)),
//     },
//     {
//       label: "Word (.doc)",
//       run: () =>
//         downloadText(
//           `${name}.doc`,
//           "application/msword",
//           documentHtml(title, content),
//         ),
//     },
//     {
//       label: "PDF (print)",
//       run: () => printHtml(documentHtml(title, content)),
//     },
//   ];
//
//   return (
//     <div ref={ref} className="relative">
//       <Button
//         size="sm"
//         onClick={toggle}
//         aria-haspopup="menu"
//         aria-expanded={open}
//       >
//         <LuDownload className="size-3.5" />
//         Export
//         <LuChevronDown className="size-3.5" />
//       </Button>
//       {open && (
//         <ul
//           role="menu"
//           className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
//         >
//           {items.map((i) => (
//             <li key={i.label} role="none">
//               <button
//                 type="button"
//                 role="menuitem"
//                 onClick={() => {
//                   i.run();
//                   hide();
//                 }}
//                 className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
//               >
//                 {i.label}
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
