import type { FormEvent } from "react";
import { connectableApps } from "../../../constants/connectedApps";
import AppToggleRow from "../AppToggleRow";
import FormError from "../FormError";
import StepActions from "../StepActions";
import StepShell from "../StepShell";

interface Props {
  selected: number[];
  onToggle: (id: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  focusOnMount?: boolean;
}

export default function AppsStep({
  selected,
  onToggle,
  onSubmit,
  onBack,
  loading,
  error,
  focusOnMount,
}: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit}>
      <StepShell
        title="Connect your apps"
        description="Optional. You'll approve access with Google next."
        focusOnMount={focusOnMount}
        footer={
          <StepActions
            nextLabel={
              selected.length
                ? `Create account & connect (${selected.length})`
                : "Create account"
            }
            loading={loading}
            onBack={onBack}
          />
        }
      >
        <div className="space-y-2">
          {error && <FormError message={error} />}
          {connectableApps.map((app, i) => (
            <AppToggleRow
              key={app.id}
              app={app}
              index={i}
              on={selected.includes(app.id)}
              onToggle={() => onToggle(app.id)}
            />
          ))}
        </div>
      </StepShell>
    </form>
  );
}
