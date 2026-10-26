import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { features } from "../../constants/landing";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/cn";
import { nextPathFor, paths } from "../../router/paths";
import IconButton from "../ui/IconButton";
import Reveal from "./Reveal";

export default function FeaturesSection() {
  const { user } = useAuth();
  const scroller = useRef<HTMLUListElement>(null);
  const [selectedId, setSelectedId] = useState(features[0].id);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const selected = features.find((f) => f.id === selectedId) ?? features[0];

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el)
      el.scrollBy({
        left: dir * Math.max(280, el.clientWidth * 0.8),
        behavior: "smooth",
      });
  };

  return (
    <section
      id="features"
      className="scroll-mt-14 border-t border-zinc-200 py-20 sm:py-28 dark:border-zinc-800"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Core functions
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything for studying, in one place.
              </h2>
            </div>
            <div className="flex gap-1">
              <IconButton
                label="Scroll left"
                onClick={() => scrollBy(-1)}
                disabled={!canLeft}
                className="border border-zinc-200 disabled:opacity-40 dark:border-zinc-800"
              >
                <LuChevronLeft className="size-5" />
              </IconButton>
              <IconButton
                label="Scroll right"
                onClick={() => scrollBy(1)}
                disabled={!canRight}
                className="border border-zinc-200 disabled:opacity-40 dark:border-zinc-800"
              >
                <LuChevronRight className="size-5" />
              </IconButton>
            </div>
          </div>
        </Reveal>
      </div>

      <ul
        ref={scroller}
        onScroll={update}
        aria-label="Core functions"
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] [&::-webkit-scrollbar]:hidden"
      >
        {features.map((f) => {
          const Icon = f.icon;
          const active = f.id === selectedId;
          return (
            <li key={f.id} className="w-72 shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(f.id)}
                className={cn(
                  "flex h-full w-full flex-col gap-4 rounded-2xl border p-6 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                  active
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60",
                )}
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold">
                    {f.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {f.short}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <div
          key={selected.id}
          aria-live="polite"
          className="animate-fade-up rounded-2xl border border-zinc-200 p-6 sm:p-8 dark:border-zinc-800"
        >
          <h3 className="text-lg font-semibold">{selected.title}</h3>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            {selected.detail}
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Try asking:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              “{selected.example}”
            </span>
          </p>
          <Link
            to={user ? nextPathFor(user) : paths.signup}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            {user ? "Open the app" : "Get started"}
            <LuArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
