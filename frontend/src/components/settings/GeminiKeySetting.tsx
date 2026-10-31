import { useState } from "react";
import { LuKeyRound } from "react-icons/lu";
import FormError from "../auth/FormError";
import InlineStatus from "../common/InlineStatus";
import Button from "../ui/Button";

interface Props {
  hasKey: boolean;
  onSave: (key: string) => Promise<void>;
}

export default function GeminiKeySetting({ hasKey, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const valid = value.trim().length >= 20;

  const close = () => {
    setEditing(false);
    setValue("");
    setError(null);
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(value.trim());
      close();
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save the key. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <LuKeyRound className="size-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {hasKey ? "Key saved" : "No key added"}
            </p>
            <p className="text-xs text-zinc-500">
              Stored encrypted. Never shown again.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSaved(false);
              setEditing(true);
            }}
          >
            {hasKey ? "Update" : "Add"}
          </Button>
        </div>
        {saved && <InlineStatus>Key saved</InlineStatus>}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      {error && <FormError message={error} />}
      <label htmlFor="gemini-key" className="text-sm font-medium">
        New Gemini API key
      </label>
      <input
        id="gemini-key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste your key"
        className="h-10 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={close} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!valid}
          loading={loading}
          onClick={save}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
