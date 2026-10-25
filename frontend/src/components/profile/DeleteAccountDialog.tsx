import { useEffect, useState } from "react";
import FormError from "../auth/FormError";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

interface Props {
  open: boolean;
  onClose: () => void; // must be stable (useDisclosure's hide)
  onConfirm: () => Promise<void>;
}

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setText("");
      setError(null);
    }
  }, [open]);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(); // on success the session ends and the router leaves this page
    } catch {
      setError("Could not delete your account. Try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete your account?"
      description="This permanently removes your chats, connected accounts, saved Gemini key and sessions. This cannot be undone."
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={text !== CONFIRM_WORD}
            onClick={confirm}
          >
            Delete account
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <FormError message={error} />}
        <label htmlFor="delete-confirm" className="block text-sm font-medium">
          Type {CONFIRM_WORD} to confirm
        </label>
        <input
          id="delete-confirm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100"
        />
      </div>
    </Dialog>
  );
}
