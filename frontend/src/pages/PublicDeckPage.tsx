import { useState } from "react";
import { useParams } from "react-router-dom";
import { LuLink2Off } from "react-icons/lu";
import { publicApi } from "../api/share.api";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import { useResource } from "../hooks/useResource";
import PublicLayout from "../layouts/PublicLayout";

const EMPTY = { title: "", cards: [] as { front: string; back: string }[] };

export default function PublicDeckPage() {
  const { token = "" } = useParams();
  const { status, data, refetch } = useResource(
    (s) => publicApi.deck(token, s),
    EMPTY,
    undefined,
    token,
  );
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const card = data.cards[i];

  const go = (n: number) => {
    setI(Math.min(data.cards.length - 1, Math.max(0, n)));
    setShow(false);
  };

  return (
    <PublicLayout>
      <ResourceView
        status={status === "error" ? "empty" : status}
        onRetry={refetch}
        skeleton={<Skeleton className="h-72 w-full" />}
        empty={
          <StateView
            icon={LuLink2Off}
            title="This link is not available"
            description="It may be invalid, or the owner turned sharing off."
          />
        }
      >
        <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {data.cards.length} cards · View only
        </p>
        {card && (
          <div className="mx-auto mt-8 max-w-xl space-y-4">
            <div
              key={i}
              className="animate-fade-up rounded-2xl border border-zinc-200 p-6 sm:p-8 dark:border-zinc-800"
            >
              <p className="text-xs font-medium text-zinc-500">
                Card {i + 1} of {data.cards.length}
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-lg font-medium">
                {card.front}
              </p>
              {show && (
                <>
                  <hr className="my-5 border-zinc-200 dark:border-zinc-800" />
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
                    {card.back}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => go(i - 1)} disabled={i === 0}>
                Previous
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setShow((s) => !s)}
              >
                {show ? "Hide answer" : "Show answer"}
              </Button>
              <Button
                onClick={() => go(i + 1)}
                disabled={i === data.cards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </ResourceView>
    </PublicLayout>
  );
}
