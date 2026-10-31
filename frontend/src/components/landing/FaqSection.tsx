import { useId, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { faqs } from "../../constants/landing";
import { cn } from "../../lib/cn";
import Container from "./Container";
import Reveal from "./Reveal";

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <li className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium transition-colors hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-300 dark:focus-visible:outline-zinc-100"
        >
          <span className="min-w-0 break-words">{q}</span>
          <LuPlus
            className={cn(
              "size-5 shrink-0 transition-transform duration-300",
              open && "rotate-45",
            )}
          />
        </button>
      </h3>
      <div
        id={id}
        role="region"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          className={cn(
            "overflow-hidden transition-[visibility] duration-300",
            !open && "invisible",
          )}
        >
          <p className="break-words pb-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {a}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-14 border-t border-zinc-200 py-20 sm:py-28 dark:border-zinc-800"
    >
      <Container>
        <Reveal>
          <p className="text-sm font-medium text-zinc-500">FAQ</p>
          <h2 className="mt-2 max-w-2xl break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <ul className="mt-10 max-w-3xl rounded-2xl border border-zinc-200 px-6 dark:border-zinc-800">
            {faqs.map((f) => (
              <Item key={f.q} q={f.q} a={f.a} />
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
