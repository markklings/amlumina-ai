import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuShare2, LuTrash2 } from "react-icons/lu";
import { ApiError } from "../api/ApiError";
import { documentsApi } from "../api/workspace.api";
import StateView from "../components/common/StateView";
import ExportMenu from "../components/documents/ExportMenu";
import DocEditor from "../components/editor/DocEditor";
import ShareDialog from "../components/share/ShareDialog";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import IconButton from "../components/ui/IconButton";
import Spinner from "../components/ui/Spinner";
import { useDisclosure } from "../hooks/useDisclosure";
import { paths } from "../router/paths";

type Load = "loading" | "ready" | "error" | "notfound";
type SaveState = "saved" | "saving" | "unsaved" | "error";

const SAVE_TEXT: Record<SaveState, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Could not save",
};

export default function DocumentEditorPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const del = useDisclosure();
  const share = useDisclosure();

  const [load, setLoad] = useState<Load>("loading");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [save, setSave] = useState<SaveState>("saved");

  const latest = useRef({ title: "", html: "" });
  const dirty = useRef(false);
  const saving = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    setLoad("loading");
    documentsApi.get(id, controller.signal).then(
      (d) => {
        latest.current = { title: d.title, html: d.html };
        dirty.current = false;
        setTitle(d.title);
        setHtml(d.html);
        setSave("saved");
        setLoad("ready");
      },
      (e: unknown) => {
        if (!controller.signal.aborted)
          setLoad(
            e instanceof ApiError && e.status === 404 ? "notfound" : "error",
          );
      },
    );
    return () => controller.abort();
  }, [id]);

  const flush = useCallback(async () => {
    if (saving.current || !dirty.current) return;
    saving.current = true;
    setSave("saving");
    try {
      while (dirty.current) {
        dirty.current = false;
        const snap = latest.current;
        await documentsApi.update(id, {
          title: snap.title.trim() || "Untitled document",
          html: snap.html,
        });
      }
      setSave("saved");
    } catch {
      dirty.current = true;
      setSave("error");
    } finally {
      saving.current = false;
    }
  }, [id]);

  const touch = () => {
    dirty.current = true;
    setSave("unsaved");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 1200);
  };

  const onTitle = (v: string) => {
    latest.current = { ...latest.current, title: v };
    setTitle(v);
    touch();
  };
  const onBody = useCallback(
    (v: string) => {
      latest.current = { ...latest.current, html: v };
      setHtml(v);
      dirty.current = true;
      setSave("unsaved");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), 1200);
    },
    [flush],
  );

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      void flush();
    },
    [flush],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const saveNow = () => {
    window.clearTimeout(timer.current);
    void flush();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveNow();
    }
  };
  const back = async () => {
    window.clearTimeout(timer.current);
    await flush();
    navigate(paths.library);
  };

  if (load === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (load !== "ready") {
    return (
      <StateView
        icon={LuTrash2}
        title={
          load === "notfound"
            ? "Document not found"
            : "Could not load this document"
        }
        description={
          load === "notfound"
            ? "It may have been deleted."
            : "Check your connection and try again."
        }
        action={
          <Button variant="primary" onClick={() => navigate(paths.library)}>
            Back to Library
          </Button>
        }
      />
    );
  }

  const name = title.trim() || "Untitled document";
  const ask = (what: string) => () =>
    navigate(paths.chat, {
      state: {
        prompt: `Make ${what} from my document "${name}" (id ${id}). Read it first with documents_read.`,
      },
    });

  return (
    <div onKeyDown={onKeyDown}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <IconButton label="Back to Library" onClick={() => void back()}>
          <LuArrowLeft className="size-5" />
        </IconButton>
        <input
          aria-label="Document title"
          value={title}
          maxLength={255}
          onChange={(e) => onTitle(e.target.value)}
          className="min-w-0 flex-1 basis-48 rounded-lg bg-transparent px-2 py-1.5 text-xl font-semibold tracking-tight outline-none focus:bg-zinc-100 dark:focus:bg-zinc-900"
        />
        <span role="status" className="text-xs text-zinc-500">
          {SAVE_TEXT[save]}
        </span>
        {save === "error" && (
          <Button size="sm" onClick={saveNow}>
            Retry
          </Button>
        )}
        <Button size="sm" onClick={ask("flashcards")}>
          Flashcards
        </Button>
        <Button size="sm" onClick={ask("a 10-question quiz")}>
          Quiz
        </Button>
        <Button size="sm" onClick={share.show}>
          <LuShare2 className="size-3.5" />
          Share
        </Button>
        <ExportMenu title={name} html={html} />
        <IconButton label="Delete document" onClick={del.show}>
          <LuTrash2 className="size-4" />
        </IconButton>
      </div>

      <DocEditor key={id} html={html} onChange={onBody} />

      <ShareDialog
        open={share.open}
        kind="doc"
        targetId={id}
        title={name}
        onClose={share.hide}
      />
      <ConfirmDialog
        open={del.open}
        onClose={del.hide}
        title="Delete this document?"
        description="It will be permanently deleted."
        confirmLabel="Delete document"
        onConfirm={async () => {
          dirty.current = false;
          window.clearTimeout(timer.current);
          await documentsApi.remove(id);
          navigate(paths.library, { replace: true });
        }}
      />
    </div>
  );
}
