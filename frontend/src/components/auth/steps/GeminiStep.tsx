import { useState, type FormEvent } from "react";
import { LuExternalLink, LuLock } from "react-icons/lu";
import { validators } from "../../../lib/validators";
import FormError from "../FormError";
import PasswordField from "../PasswordField";
import StepActions from "../StepActions";
import StepShell from "../StepShell";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  loading?: boolean;
  error?: string | null;
  focusOnMount?: boolean;
}

export default function GeminiStep({
  value,
  onChange,
  onNext,
  onBack,
  nextLabel = "Continue",
  loading,
  error,
  focusOnMount,
}: Props) {
  const [fieldError, setFieldError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validators.geminiKey(value);
    setFieldError(found);
    if (!found) onNext();
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepShell
        title="Add your Gemini API key"
        description="Lumi runs on your own key, so your usage stays yours."
        focusOnMount={focusOnMount}
        footer={
          <StepActions
            nextLabel={nextLabel}
            loading={loading}
            onBack={onBack}
          />
        }
      >
        <div className="space-y-3">
          {error && <FormError message={error} />}
          <PasswordField
            label="Gemini API key"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your key"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setFieldError(null);
            }}
            error={fieldError}
          />
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <LuLock className="size-3.5 shrink-0" />
            Stored encrypted and never shown again.
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium underline-offset-4 hover:underline"
          >
            Get a key from Google AI Studio
            <LuExternalLink className="size-3.5" />
          </a>
        </div>
      </StepShell>
    </form>
  );
}
