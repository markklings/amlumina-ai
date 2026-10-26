import { Link } from "react-router-dom";
import { LuArrowDown, LuArrowRight } from "react-icons/lu";
import { APP_NAME, LANDING_QUOTE } from "../../constants/app";
import { useAuth } from "../../hooks/useAuth";
import { nextPathFor, paths } from "../../router/paths";

export default function HeroSection() {
  const { user } = useAuth();
  const to = user ? nextPathFor(user) : paths.signup;

  return (
    <section
      id="top"
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-16 text-center sm:px-6"
    >
      <p className="animate-fade-up text-sm font-medium text-zinc-500">
        {APP_NAME}
      </p>

      <figure className="mt-6 max-w-3xl animate-fade-up [animation-delay:120ms]">
        <blockquote className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          “{LANDING_QUOTE.text}”
        </blockquote>
        <figcaption className="mt-4 text-sm text-zinc-500">
          {LANDING_QUOTE.author}
        </figcaption>
      </figure>

      <p className="mt-8 max-w-xl animate-fade-up text-[15px] leading-7 text-zinc-600 [animation-delay:240ms] dark:text-zinc-400">
        A study companion that teaches the way you learn and works with your
        Google Classroom, Calendar and Tasks.
      </p>

      <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:360ms]">
        <Link
          to={to}
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-[background-color,transform] hover:bg-zinc-700 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {user ? "Open app" : "Get started"}
          <LuArrowRight className="size-4" />
        </Link>
        <a
          href="#about"
          className="inline-flex h-12 items-center rounded-lg border border-zinc-200 px-6 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Learn more
        </a>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About"
        className="mt-14 inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100"
      >
        <LuArrowDown className="size-4 animate-bounce motion-reduce:animate-none" />
      </a>
    </section>
  );
}
