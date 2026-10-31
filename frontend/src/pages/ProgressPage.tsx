import { useNavigate } from "react-router-dom";
import { LuTrendingUp } from "react-icons/lu";
import { insightsApi } from "../api/insights.api";
import MiniBars from "../components/common/MiniBars";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import { useResource } from "../hooks/useResource";
import { relativeTime } from "../lib/dates";
import { formatNumber } from "../lib/format";
import { todayKey } from "../lib/planner";
import { paths } from "../router/paths";
import type { ProgressData } from "../types/insights";

const EMPTY: ProgressData = {
  week: [],
  focus: { weekMinutes: 0 },
  cards: { total: 0, due: 0, reviews7: 0, goodRate: null },
  quizzes: { recent: [], average: null },
  tasks: { open: 0, overdue: 0, dueSoon: 0, done7: 0 },
  chat: { messages7: 0, tokens7: 0 },
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { status, data, refetch } = useResource(
    (s) => insightsApi.progress(todayKey(), s),
    EMPTY,
  );
  const d = data;
  const empty =
    d.chat.messages7 +
      d.cards.reviews7 +
      d.focus.weekMinutes +
      d.tasks.done7 +
      d.quizzes.recent.length ===
    0;

  return (
    <>
      <PageHeader
        title="Progress"
        description="Your last 7 days at a glance."
      />
      <ResourceView
        status={
          status === "ready" && empty && d.tasks.open + d.cards.total === 0
            ? "empty"
            : status
        }
        onRetry={refetch}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        }
        empty={
          <StateView
            icon={LuTrendingUp}
            title="Nothing to show yet"
            description="Study with a focus session, review flashcards or take a quiz, and your progress appears here."
            action={
              <Button variant="primary" onClick={() => navigate(paths.focus)}>
                Start a focus session
              </Button>
            }
          />
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Focus this week"
              value={`${formatNumber(d.focus.weekMinutes)} min`}
            />
            <Stat
              label="Flashcards due"
              value={String(d.cards.due)}
              hint={`${d.cards.total} cards in total`}
            />
            <Stat
              label="Card accuracy"
              value={d.cards.goodRate === null ? "n/a" : `${d.cards.goodRate}%`}
              hint={`${d.cards.reviews7} reviews (Good or Easy)`}
            />
            <Stat
              label="Quiz average"
              value={
                d.quizzes.average === null ? "n/a" : `${d.quizzes.average}%`
              }
              hint="Your latest attempts"
            />
            <Stat
              label="Tasks open"
              value={String(d.tasks.open)}
              hint={`${d.tasks.dueSoon} due within 7 days`}
            />
            <Stat label="Overdue" value={String(d.tasks.overdue)} />
            <Stat
              label="Tasks done"
              value={String(d.tasks.done7)}
              hint="Last 7 days"
            />
            <Stat
              label="Questions asked"
              value={String(d.chat.messages7)}
              hint={`${formatNumber(d.chat.tokens7)} tokens`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MiniBars
              label="Focus minutes"
              unit=" min"
              items={d.week.map((w) => ({ day: w.day, value: w.focusMinutes }))}
            />
            <MiniBars
              label="Flashcards reviewed"
              items={d.week.map((w) => ({ day: w.day, value: w.reviews }))}
            />
          </div>

          <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-xs font-medium text-zinc-500">
              Recent quizzes
            </h2>
            {d.quizzes.recent.length ? (
              <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
                {d.quizzes.recent.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{q.title}</span>
                    <span className="text-xs text-zinc-500">
                      {relativeTime(q.at)}
                    </span>
                    <span className="w-12 text-right font-medium tabular-nums">
                      {q.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No quiz attempts yet.
              </p>
            )}
          </section>
        </div>
      </ResourceView>
    </>
  );
}
