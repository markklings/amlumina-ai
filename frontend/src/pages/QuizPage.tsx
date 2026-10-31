import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuCheck, LuCircleAlert } from "react-icons/lu";
import { practiceApi } from "../api/practice.api";
import FormError from "../components/auth/FormError";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import Button from "../components/ui/Button";
import { useResource } from "../hooks/useResource";
import { cn } from "../lib/cn";
import { paths } from "../router/paths";
import type { AttemptResult, QuizPublic } from "../types/practice";

const EMPTY: QuizPublic = { id: "", title: "", questions: [] };

export default function QuizPage() {
  const { id = "" } = useParams();
  const { status, data, refetch } = useResource(
    (s) => practiceApi.quiz(id, s),
    EMPTY,
    undefined,
    id,
  );
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [i, setI] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setAnswers(Array(data.questions.length).fill(null));
    setI(0);
    setResult(null);
    setError(null);
  };
  useEffect(() => {
    if (status === "ready") reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, data]);

  const q = data.questions[i];
  const last = i === data.questions.length - 1;
  const unanswered = answers.filter((a) => a === null).length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await practiceApi.attempt(id, answers));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          {data.title || "Quiz"}
        </h1>
      </div>

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={<Skeleton className="h-80 w-full" />}
        empty={null}
      >
        {result ? (
          <div className="mx-auto max-w-2xl animate-fade-up space-y-4">
            <div className="rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500">Your score</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">
                {result.score} / {result.total}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {Math.round((result.score / Math.max(1, result.total)) * 100)}%
              </p>
              <Button variant="primary" className="mt-4" onClick={reset}>
                Retake
              </Button>
            </div>

            <ol className="space-y-3">
              {data.questions.map((qq, n) => {
                const r = result.results[n];
                const mine = answers[n];
                return (
                  <li
                    key={n}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <p className="flex items-start gap-2 text-sm font-medium">
                      {r.correct ? (
                        <LuCheck className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <LuCircleAlert className="mt-0.5 size-4 shrink-0" />
                      )}
                      {n + 1}. {qq.prompt}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Your answer:{" "}
                      {mine === null ? "No answer" : qq.options[mine]}
                    </p>
                    {!r.correct && (
                      <p className="mt-1 text-xs font-medium">
                        Correct answer: {qq.options[r.answerIndex]}
                      </p>
                    )}
                    {r.explanation && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {r.explanation}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : q ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <p className="text-xs font-medium text-zinc-500">
              Question {i + 1} of {data.questions.length}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100"
                style={{ width: `${((i + 1) / data.questions.length) * 100}%` }}
              />
            </div>

            <div
              key={i}
              className="animate-fade-up rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800"
            >
              <p className="text-[17px] font-medium leading-7">{q.prompt}</p>
              <div
                role="radiogroup"
                aria-label="Answers"
                className="mt-5 space-y-2"
              >
                {q.options.map((o, n) => {
                  const active = answers[i] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() =>
                        setAnswers((a) => a.map((v, k) => (k === i ? n : v)))
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                        active
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60",
                      )}
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                        {String.fromCharCode(65 + n)}
                      </span>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <FormError message={error} />}
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={() => setI((v) => Math.max(0, v - 1))}
                disabled={i === 0 || submitting}
              >
                Previous
              </Button>
              {last ? (
                <div className="flex items-center gap-3">
                  {unanswered > 0 && (
                    <span className="text-xs text-zinc-500">
                      {unanswered} unanswered
                    </span>
                  )}
                  <Button
                    variant="primary"
                    loading={submitting}
                    onClick={submit}
                  >
                    Submit
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={() => setI((v) => v + 1)}>
                  Next
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </ResourceView>
    </>
  );
}
