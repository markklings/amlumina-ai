import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuFileText, LuSearchX, LuTrash2 } from "react-icons/lu";
import { documentsApi } from "../api/workspace.api";
import FormError from "../components/auth/FormError";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import IconButton from "../components/ui/IconButton";
import SearchField from "../components/ui/SearchField";
import { useDocuments } from "../hooks/useDocuments";
import { relativeTime } from "../lib/dates";
import { paths } from "../router/paths";
import type { DocSummary } from "../types/document";

export default function LibraryPage() {
  const navigate = useNavigate();
  const { status, data, refetch, mutate } = useDocuments();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DocSummary | null>(null);
  const closeDelete = useCallback(() => setPendingDelete(null), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.excerpt.toLowerCase().includes(q),
    );
  }, [data, query]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const doc = await documentsApi.create();
      navigate(`${paths.document}/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create a document.");
      setCreating(false);
    }
  };

  const askLumi = () =>
    navigate(paths.chat, {
      state: { prompt: "Create a reviewer document about " },
    });

  return (
    <>
      <PageHeader
        title="Library"
        description="Your documents. Write your own or ask Lumi to create them."
        actions={
          <>
            <Button size="sm" onClick={askLumi}>
              Create with Lumi
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={creating}
              onClick={create}
            >
              New document
            </Button>
          </>
        }
      />
      {error && (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      )}

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        }
        empty={
          <StateView
            icon={LuFileText}
            title="No documents yet"
            description="Start a blank document, or ask Lumi to write a reviewer and it will show up here."
            action={
              <Button variant="primary" loading={creating} onClick={create}>
                New document
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          <div className="sm:w-72">
            <SearchField
              value={query}
              onChange={setQuery}
              label="Search documents"
              placeholder="Search"
            />
          </div>

          {visible.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {visible.map((d) => (
                <li key={d.id} className="group relative">
                  <Link
                    to={`${paths.document}/${d.id}`}
                    className="flex h-full flex-col gap-1 rounded-xl border border-zinc-200 p-4 pr-12 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                  >
                    <span className="truncate text-sm font-medium">
                      {d.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-zinc-500">
                      {d.excerpt || "Empty document"}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      Edited {relativeTime(d.updatedAt)}
                      {d.source === "lumi" && " · Created by Lumi"}
                    </span>
                  </Link>
                  <IconButton
                    label={`Delete ${d.title}`}
                    onClick={() => setPendingDelete(d)}
                    className="absolute right-2 top-2 size-8"
                  >
                    <LuTrash2 className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          ) : (
            <StateView
              icon={LuSearchX}
              title="No matches"
              description="Try a different search."
            />
          )}
        </div>
      </ResourceView>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={closeDelete}
        title="Delete this document?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete document"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await documentsApi.remove(pendingDelete.id);
          mutate((list) => list.filter((d) => d.id !== pendingDelete.id));
          setPendingDelete(null);
        }}
      />
    </>
  );
}
