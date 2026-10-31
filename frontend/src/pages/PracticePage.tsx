import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuLayers, LuListChecks, LuTrash2, LuShare2 } from "react-icons/lu";
import { practiceApi } from "../api/practice.api";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import IconButton from "../components/ui/IconButton";
import Tabs from "../components/ui/Tabs";
import { useResource } from "../hooks/useResource";
import { paths } from "../router/paths";
import type { DeckSummary, QuizSummary } from "../types/practice";
import ShareDialog from "../components/share/ShareDialog";

type Tab = "decks" | "quizzes";
type Pending = { kind: Tab; id: string; title: string } | null;

const NO_DECKS: DeckSummary[] = [];
const NO_QUIZZES: QuizSummary[] = [];

const skeleton = (
  <div className="space-y-3">
    {[0, 1, 2].map((i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
);

export default function PracticePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("decks");
  const decks = useResource(
    (s) => practiceApi.decks(s),
    NO_DECKS,
    (d) => d.length === 0,
  );
  const quizzes = useResource(
    (s) => practiceApi.quizzes(s),
    NO_QUIZZES,
    (d) => d.length === 0,
  );
  const [pending, setPending] = useState<Pending>(null);
  const closePending = useCallback(() => setPending(null), []);

  const askLumi = (prompt: string) =>
    navigate(paths.chat, { state: { prompt } });

  const confirm = async () => {
    if (!pending) return;
    if (pending.kind === "decks") {
      await practiceApi.removeDeck(pending.id);
      decks.mutate((l) => l.filter((d) => d.id !== pending.id));
    } else {
      await practiceApi.removeQuiz(pending.id);
      quizzes.mutate((l) => l.filter((q) => q.id !== pending.id));
    }
    setPending(null);
  };

  const [shareDeck, setShareDeck] = useState<DeckSummary | null>(null);
  const closeShare = useCallback(() => setShareDeck(null), []);

  const card = "group relative";
  const link =
    "flex h-full flex-col gap-1 rounded-xl border border-zinc-200 p-4 pr-20 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100";

  return (
    <>
      <PageHeader
        title="Practice"
        description="Flashcards with spaced repetition, and quizzes Lumi makes for you."
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              askLumi(
                tab === "decks"
                  ? "Make flashcards about "
                  : "Make a 10-question quiz about ",
              )
            }
          >
            {tab === "decks" ? "Make flashcards" : "Make a quiz"}
          </Button>
        }
      />

      <div className="mb-5">
        <Tabs<Tab>
          label="Practice type"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "decks", label: "Flashcards", count: decks.data.length },
            { value: "quizzes", label: "Quizzes", count: quizzes.data.length },
          ]}
        />
      </div>

      {tab === "decks" ? (
        <ResourceView
          status={decks.status}
          onRetry={decks.refetch}
          skeleton={skeleton}
          empty={
            <StateView
              icon={LuLayers}
              title="No flashcard decks yet"
              description="Ask Lumi to turn a topic or one of your documents into flashcards."
              action={
                <Button
                  variant="primary"
                  onClick={() => askLumi("Make flashcards about ")}
                >
                  Make flashcards
                </Button>
              }
            />
          }
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {decks.data.map((d) => (
              <li key={d.id} className={card}>
                <Link to={`${paths.practice}/deck/${d.id}`} className={link}>
                  <span className="truncate text-sm font-medium">
                    {d.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {d.total} cards ·{" "}
                    {d.due ? `${d.due} due now` : "nothing due"}
                  </span>
                </Link>
                <IconButton
                  label={`Delete ${d.title}`}
                  onClick={() =>
                    setPending({ kind: "decks", id: d.id, title: d.title })
                  }
                  className="absolute right-2 top-2 size-8"
                >
                  <LuTrash2 className="size-4" />
                </IconButton>
                <IconButton
                  label={`Share ${d.title}`}
                  onClick={() => setShareDeck(d)}
                  className="absolute right-11 top-2 size-8"
                >
                  <LuShare2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </ResourceView>
      ) : (
        <ResourceView
          status={quizzes.status}
          onRetry={quizzes.refetch}
          skeleton={skeleton}
          empty={
            <StateView
              icon={LuListChecks}
              title="No quizzes yet"
              description="Ask Lumi to quiz you on a topic or one of your documents."
              action={
                <Button
                  variant="primary"
                  onClick={() => askLumi("Make a 10-question quiz about ")}
                >
                  Make a quiz
                </Button>
              }
            />
          }
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {quizzes.data.map((q) => (
              <li key={q.id} className={card}>
                <Link to={`${paths.practice}/quiz/${q.id}`} className={link}>
                  <span className="truncate text-sm font-medium">
                    {q.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {q.questionCount} questions ·{" "}
                    {q.attempts
                      ? `${q.attempts} attempts, best ${q.best}%`
                      : "not taken yet"}
                  </span>
                </Link>
                <IconButton
                  label={`Delete ${q.title}`}
                  onClick={() =>
                    setPending({ kind: "quizzes", id: q.id, title: q.title })
                  }
                  className="absolute right-2 top-2 size-8"
                >
                  <LuTrash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </ResourceView>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={closePending}
        title={
          pending?.kind === "decks" ? "Delete this deck?" : "Delete this quiz?"
        }
        description={
          pending
            ? `"${pending.title}" will be permanently deleted${pending.kind === "quizzes" ? ", with its history" : ""}.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirm}
      />

      {shareDeck && (
        <ShareDialog
          open
          kind="deck"
          targetId={shareDeck.id}
          title={shareDeck.title}
          onClose={closeShare}
        />
      )}
    </>
  );
}
