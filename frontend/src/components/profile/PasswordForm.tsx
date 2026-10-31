import { useState, type FormEvent } from "react";
import FormError from "../auth/FormError";
import PasswordField from "../auth/PasswordField";
import InlineStatus from "../common/InlineStatus";
import Button from "../ui/Button";
import { AuthError } from "../../lib/authError";
import { validators } from "../../lib/validators";

interface Props {
  onSave: (current: string, next: string) => Promise<void>;
}

type Errors = { current?: string; next?: string; confirm?: string };

export default function PasswordForm({ onSave }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const clear = (field: keyof Errors) => {
    setErrors((p) => ({ ...p, [field]: undefined }));
    setSaved(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setFormError(null);

    const found: Errors = {
      current: current ? undefined : "Enter your current password",
      next: validators.password(next) ?? undefined,
      confirm: validators.confirmPassword(confirm, next) ?? undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setLoading(true);
    try {
      await onSave(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
    } catch (err) {
      if (err instanceof AuthError && err.code === "INVALID_CREDENTIALS")
        setErrors({ current: err.message });
      else setFormError("Could not update your password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <FormError message={formError} />}
      <PasswordField
        label="Current password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value);
          clear("current");
        }}
        error={errors.current}
      />
      <PasswordField
        label="New password"
        autoComplete="new-password"
        placeholder="8+ characters"
        value={next}
        onChange={(e) => {
          setNext(e.target.value);
          clear("next");
        }}
        error={errors.next}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          clear("confirm");
        }}
        error={errors.confirm}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" loading={loading}>
          Update password
        </Button>
        {saved && <InlineStatus>Password updated</InlineStatus>}
      </div>
    </form>
  );
}
