import { useEffect, useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { sharesApi, type ShareKind } from "../../api/share.api";
import FormError from "../auth/FormError";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import ToggleTrack from "../ui/ToggleTrack";

interface Props {
  open: boolean;
  kind: ShareKind;
  targetId: string;
  title: string;
  onClose: () => void; // must be stable
}

export default function ShareDialog({
  open,
  kind,
  targetId,
  title,
  onClose,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoaded(false);
    setError(null);
    setCopied(false);
    sharesApi
      .status(kind, targetId)
      .then((s) => active && (setToken(s.token), setLoaded(true)))
      .catch(() => active && setError("Could not load sharing."));
    return () => {
      active = false;
    };
  }, [open, kind, targetId]);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = token
        ? await sharesApi.disable(kind, targetId)
        : await sharesApi.enable(kind, targetId);
      setToken(s.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update sharing.");
    } finally {
      setBusy(false);
    }
  };

  const link = token ? `${location.origin}/s/${kind}/${token}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Share ${kind === "doc" ? "document" : "deck"}`}
      description={`"${title}"`}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="space-y-3">
        {error && <FormError message={error} />}
        <button
          type="button"
          role="switch"
          aria-checked={!!token}
          disabled={!loaded || busy}
          onClick={() => void toggle()}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left disabled:opacity-60 dark:border-zinc-800"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Anyone with the link can view
            </span>
            <span className="block text-xs text-zinc-500">
              View only. They cannot edit, and no account is needed.
            </span>
          </span>
          <ToggleTrack on={!!token} />
        </button>
        {token && (
          <div className="flex gap-2">
            <input
              readOnly
              aria-label="Share link"
              value={link}
              onFocus={(e) => e.target.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 text-xs outline-none dark:border-zinc-800"
            />
            <Button onClick={() => void copy()}>
              {copied ? (
                <LuCheck className="size-4" />
              ) : (
                <LuCopy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
        <p className="text-xs text-zinc-500">
          Turning sharing off stops the link from working. Changes you make to
          the document appear on the link.
        </p>
      </div>
    </Dialog>
  );
}
