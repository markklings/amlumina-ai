import { DEVELOPER, SUPPORT_EMAIL } from "../../constants/app";
// import Avatar from "../ui/Avatar";
import Reveal from "./Reveal";

export default function DeveloperSection() {
  return (
    <section
      id="developer"
      className="scroll-mt-14 border-t border-zinc-200 px-4 py-20 sm:px-6 sm:py-28 dark:border-zinc-800"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-sm font-medium text-zinc-500">Developer</p>
          <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-zinc-200 p-6 sm:flex-row sm:items-center sm:p-8 dark:border-zinc-800">
            {/*<Avatar
              name={DEVELOPER.name}
              size="md"
              className="size-16 text-xl"
            />*/}
            <img
              src="/bytestack.svg"
              alt={DEVELOPER.name}
              className="size-16 border-2 border-black dark:border-white rounded-full"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {DEVELOPER.team}{" "}
                <span className="text-zinc-500">by {DEVELOPER.name}</span>
              </h2>
              <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
                {DEVELOPER.blurb}
              </p>
            </div>
            {SUPPORT_EMAIL && (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Contact
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
