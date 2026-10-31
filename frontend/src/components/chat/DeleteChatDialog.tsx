import { useEffect, useState } from "react";
import type { ChatSummary } from "../../types/chat";
import FormError from "../auth/FormError";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

interface Props {
  chat: ChatSummary | null;
  onClose: () => void; // must be stable
  onConfirm: (chat: ChatSummary) => Promise<void>;
}

export default function DeleteChatDialog({ chat, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
    setError(null);
  }, [chat]);

  const confirm = async () => {
    if (!chat) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(chat);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this chat.");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!chat}
      onClose={onClose}
      title="Delete this chat?"
      description={
        chat
          ? `"${chat.title}" and all of its messages will be permanently deleted.`
          : undefined
      }
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={confirm}>
            Delete chat
          </Button>
        </>
      }
    >
      {error && <FormError message={error} />}
    </Dialog>
  );
}
