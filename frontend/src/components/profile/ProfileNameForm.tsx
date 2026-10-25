import { useState, type FormEvent } from "react";
import InlineStatus from "../common/InlineStatus";
import FormError from "../auth/FormError";
import TextField from "../auth/TextField";
import Button from "../ui/Button";
import { validators } from "../../lib/validators";

interface Props {
  fullName: string;
  email: string;
  onSave: (fullName: string) => Promise<void>;
}

export default function ProfileNameForm({ fullName, email, onSave }: Props) {
  const [name, setName] = useState(fullName);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const unchanged = name.trim() === fullName;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setFormError(null);
    const found = validators.fullName(name);
    setError(found);
    if (found) return;

    setLoading(true);
    try {
      await onSave(name);
      setSaved(true);
    } catch {
      setFormError("Could not save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <FormError message={formError} />}
      <TextField
        label="Full name"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
          setSaved(false);
        }}
        error={error}
      />
      <TextField label="Email" value={email} disabled readOnly />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={unchanged}
        >
          Save changes
        </Button>
        {saved && <InlineStatus>Saved</InlineStatus>}
      </div>
    </form>
  );
}
