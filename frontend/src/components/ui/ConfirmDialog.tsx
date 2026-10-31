import { useEffect, useState } from "react";
import FormError from "../auth/FormError";
import Button from "./Button";
import Dialog from "./Dialog";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void; // must be stable
  onConfirm: () => Promise<void>;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && <FormError message={error} />}
    </Dialog>
  );
}
