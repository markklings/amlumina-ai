import { APP_NAME } from "../../constants/app";
import { aboutPoints } from "../../constants/landing";
import Reveal from "./Reveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-14 border-t border-zinc-200 px-4 py-20 sm:px-6 sm:py-28 dark:border-zinc-800"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-sm font-medium text-zinc-500">About</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {APP_NAME} helps you understand, not just finish.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Students juggle courses, deadlines and different ways of learning.{" "}
            {APP_NAME} brings explanations, planning and your school apps into
            one chat, so you spend less time organizing and more time studying.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {aboutPoints.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 100} className="h-full">
                <div className="h-full rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {p.text}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
