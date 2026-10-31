import { useCallback, useEffect, useRef, useState } from "react";
import { practiceApi } from "../api/practice.api";
import FormError from "../components/auth/FormError";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/ui/Button";
import { useResource } from "../hooks/useResource";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { todayKey } from "../lib/planner";
import type { StudyStats } from "../types/practice";

const EMPTY: StudyStats = {
  todayMinutes: 0,
  totalMinutes: 0,
  streak: 0,
  week: [],
};
const PRESETS = [15, 25, 45, 60];
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function FocusPage() {
  const [minutes, setMinutes] = useState(25);
  const [label, setLabel] = useState("");
  const [endAt, setEndAt] = useState<number | null>(null); // set while running
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [plannedMs, setPlannedMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const finishing = useRef(false);

  const stats = useResource((s) => practiceApi.stats(todayKey(), s), EMPTY);

  const running = endAt !== null;
  const started = running || pausedLeft !== null;
  const leftMs = running
    ? Math.max(0, endAt - now)
    : (pausedLeft ?? minutes * 60_000);
  const elapsedMin = started ? Math.round((plannedMs - leftMs) / 60_000) : 0;

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [running]);

  const reset = useCallback(() => {
    setEndAt(null);
    setPausedLeft(null);
    setPlannedMs(0);
    finishing.current = false;
  }, []);

  const log = useCallback(
    async (mins: number) => {
      if (mins < 1) return reset();
      try {
        await practiceApi.logSession(
          Math.min(240, mins),
          todayKey(),
          label.trim() || undefined,
        );
        setNotice(`Logged ${mins} minute${mins === 1 ? "" : "s"}.`);
        stats.refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not log the session.");
      }
      reset();
    },
    [label, reset, stats],
  );

  // timer reached zero
  useEffect(() => {
    if (running && leftMs === 0 && !finishing.current) {
      finishing.current = true;
      void log(Math.round(plannedMs / 60_000));
    }
  }, [running, leftMs, plannedMs, log]);

  // show the countdown in the tab title, and warn before leaving a running timer
  useEffect(() => {
    if (!running) return;
    const old = document.title;
    document.title = `${mmss(leftMs)} · Focus`;
    return () => {
      document.title = old;
    };
  }, [running, leftMs]);

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const start = () => {
    setNotice(null);
    setError(null);
    const left = pausedLeft ?? minutes * 60_000;
    if (pausedLeft === null) setPlannedMs(minutes * 60_000);
    setNow(Date.now());
    setEndAt(Date.now() + left);
    setPausedLeft(null);
  };
  const pause = () => {
    setPausedLeft(leftMs);
    setEndAt(null);
  };

  const s = stats.data;
  const maxMin = Math.max(30, ...s.week.map((d) => d.minutes));

  return (
    <>
      <PageHeader
        title="Focus"
        description="Study in timed sessions. Your time and streak are tracked for you."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-zinc-200 p-6 text-center sm:p-10 dark:border-zinc-800">
          <p
            role="timer"
            aria-live="off"
            className="text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl"
          >
            {mmss(leftMs)}
          </p>

          {!started && (
            <div className="mt-6 space-y-4">
              <div
                className="flex flex-wrap justify-center gap-2"
                role="group"
                aria-label="Session length"
              >
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={minutes === m}
                    onClick={() => setMinutes(m)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      minutes === m
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                    )}
                  >
                    {m} min
                  </button>
                ))}
                <label className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <span className="sr-only">Custom minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(
                        Math.min(240, Math.max(1, Number(e.target.value) || 1)),
                      )
                    }
                    className="h-9 w-20 rounded-lg border border-zinc-200 bg-transparent px-2 text-center text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100"
                  />
                  min
                </label>
              </div>
              <input
                aria-label="What are you studying?"
                placeholder="What are you studying? (optional)"
                maxLength={100}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mx-auto h-11 w-full max-w-sm rounded-lg border border-zinc-200 bg-transparent px-3.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
              />
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {running ? (
              <Button size="lg" onClick={pause}>
                Pause
              </Button>
            ) : (
              <Button size="lg" variant="primary" onClick={start}>
                {started ? "Resume" : "Start"}
              </Button>
            )}
            {started && (
              <>
                <Button
                  size="lg"
                  onClick={() => void log(elapsedMin)}
                  disabled={elapsedMin < 1}
                >
                  Stop and log {elapsedMin} min
                </Button>
                <Button size="lg" variant="ghost" onClick={reset}>
                  Discard
                </Button>
              </>
            )}
          </div>

          <div
            aria-live="polite"
            className="mt-4 min-h-6 text-sm text-zinc-600 dark:text-zinc-400"
          >
            {notice}
          </div>
          {error && <FormError message={error} />}
        </section>

        <aside className="space-y-4">
          <dl className="grid grid-cols-3 gap-3 rounded-2xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            {[
              ["Today", `${formatNumber(s.todayMinutes)}m`],
              ["Streak", `${s.streak}d`],
              ["Total", `${formatNumber(s.totalMinutes)}m`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-zinc-500">{k}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-xs font-medium text-zinc-500">Last 7 days</h2>
            <ol className="mt-4 flex h-32 items-end gap-2">
              {s.week.map((d) => (
                <li
                  key={d.day}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  title={`${d.day}: ${d.minutes} min`}
                >
                  <span className="sr-only">
                    {d.day}: {d.minutes} minutes
                  </span>
                  <div
                    aria-hidden
                    className="w-full rounded-md bg-zinc-900 transition-[height] duration-500 dark:bg-zinc-100"
                    style={{
                      height: `${(d.minutes / maxMin) * 100}%`,
                      minHeight: d.minutes ? 4 : 2,
                      opacity: d.minutes ? 1 : 0.15,
                    }}
                  />
                  <span aria-hidden className="text-[10px] text-zinc-500">
                    {weekday.format(new Date(`${d.day}T12:00:00`))}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
