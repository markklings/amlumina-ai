import { LuTriangleAlert } from "react-icons/lu";
import { LEGAL_IS_DRAFT, LEGAL_LAST_UPDATED } from "../../constants/legal";
import type { LegalDoc } from "../../types/legal";

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="animate-fade-up">
      {LEGAL_IS_DRAFT && (
        <p
          role="note"
          className="mb-6 flex items-start gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700"
        >
          <LuTriangleAlert className="mt-0.5 size-4 shrink-0" />
          Draft: this text must be reviewed by a qualified lawyer before launch.
        </p>
      )}

      <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Last updated {LEGAL_LAST_UPDATED}
      </p>
      <p className="mt-4 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
        {doc.summary}
      </p>

      <nav
        aria-label="On this page"
        className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <p className="text-xs font-medium text-zinc-500">On this page</p>
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {doc.sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="underline-offset-4 hover:underline"
              >
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {doc.sections.map((s, i) => (
        <section key={s.id} id={s.id} className="mt-10 scroll-mt-20">
          <h2 className="text-lg font-semibold tracking-tight">
            {i + 1}. {s.title}
          </h2>
          {s.body.map((block, j) =>
            typeof block === "string" ? (
              <p
                key={j}
                className="mt-3 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300"
              >
                {block}
              </p>
            ) : (
              <ul
                key={j}
                className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300"
              >
                {block.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </article>
  );
}
