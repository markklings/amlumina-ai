import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuCircleCheck } from "react-icons/lu";
import { practiceApi } from "../api/practice.api";
import FormError from "../components/auth/FormError";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import Button from "../components/ui/Button";
import { useResource } from "../hooks/useResource";
import { paths } from "../router/paths";
import type { DeckReview, ReviewCard } from "../types/practice";

const EMPTY: DeckReview = {
  deck: { id: "", title: "" },
  cards: [],
  dueTotal: 0,
};
const GRADES = [
  { grade: 0, label: "Again", key: "1" },
  { grade: 1, label: "Hard", key: "2" },
  { grade: 2, label: "Good", key: "3" },
  { grade: 3, label: "Easy", key: "4" },
];

export default function DeckReviewPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { status, data, refetch } = useResource(
    (s) => practiceApi.deckReview(id, s),
    EMPTY,
    undefined,
    id,
  );
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [total, setTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ready") {
      setQueue(data.cards);
      setTotal(data.cards.length);
      setRevealed(false);
    }
  }, [status, data]);

  const grade = useCallback(
    async (g: number) => {
      if (!queue.length) return;
      const [cur, ...rest] = queue;
      setRevealed(false);
      setQueue(g === 0 ? [...rest, cur] : rest); // "Again" comes back in this session
      try {
        await practiceApi.reviewCard(cur.id, g);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not save that answer.",
        );
      }
    },
    [queue],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!queue.length || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        void grade(Number(e.key) - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [queue, revealed, grade]);

  const current = queue[0];
  const finished = status === "ready" && total > 0 && queue.length === 0;
  const nothingDue = status === "ready" && total === 0;

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <Link
          to={paths.practice}
          aria-label="Back to Practice"
          className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <LuArrowLeft className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">
          {data.deck.title || "Flashcards"}
        </h1>
        {current && (
          <span className="text-xs text-zinc-500">{queue.length} left</span>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      )}

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={<Skeleton className="h-72 w-full" />}
        empty={null}
      >
        {finished || nothingDue ? (
          <div className="flex animate-fade-up flex-col items-center gap-2 rounded-2xl border border-zinc-200 px-6 py-14 text-center dark:border-zinc-800">
            <LuCircleCheck className="size-7" />
            <h2 className="text-lg font-semibold">
              {finished ? "Session complete" : "Nothing due right now"}
            </h2>
            <p className="text-sm text-zinc-500">
              {finished
                ? `You reviewed ${total} cards. Cards come back when they are due.`
                : "Come back later, cards return as they become due."}
            </p>
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => navigate(paths.practice)}
            >
              Back to Practice
            </Button>
          </div>
        ) : current ? (
          <div className="mx-auto max-w-xl space-y-4">
            <div
              key={current.id}
              className="animate-fade-up rounded-2xl border border-zinc-200 p-6 sm:p-8 dark:border-zinc-800"
            >
              <p className="text-xs font-medium text-zinc-500">Question</p>
              <p className="mt-2 whitespace-pre-wrap text-lg font-medium">
                {current.front}
              </p>
              {revealed && (
                <>
                  <hr className="my-5 border-zinc-200 dark:border-zinc-800" />
                  <p className="text-xs font-medium text-zinc-500">Answer</p>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7">
                    {current.back}
                  </p>
                </>
              )}
            </div>

            {revealed ? (
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <Button
                    key={g.grade}
                    size="lg"
                    variant={g.grade === 2 ? "primary" : "outline"}
                    onClick={() => void grade(g.grade)}
                    title={`Key ${g.key}`}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                size="lg"
                variant="primary"
                className="w-full"
                onClick={() => setRevealed(true)}
              >
                Show answer
              </Button>
            )}
            <p className="hidden text-center text-xs text-zinc-500 sm:block">
              Space shows the answer. Keys 1 to 4 grade it.
            </p>
          </div>
        ) : null}
      </ResourceView>
    </>
  );
}
