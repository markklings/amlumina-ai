import { steps } from "../../constants/landing";
import Container from "./Container";
import Reveal from "./Reveal";

export default function HowItWorksSection() {
  return (
    <section
      id="how"
      className="scroll-mt-14 border-t border-zinc-200 py-20 sm:py-28 dark:border-zinc-800"
    >
      <Container>
        <Reveal>
          <p className="text-sm font-medium text-zinc-500">How it works</p>
          <h2 className="mt-2 max-w-2xl break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            From sign-up to studying in minutes.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="min-w-0">
              <Reveal delay={i * 120} className="h-full">
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 p-6 transition-colors duration-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold">
                      {s.title}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {s.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
