import { useState } from "react";
import { Link } from "react-router-dom";
import AccountStep, {
  type AccountValues,
} from "../components/auth/steps/AccountStep";
import AppsStep from "../components/auth/steps/AppsStep";
import GeminiStep from "../components/auth/steps/GeminiStep";
import MethodStep from "../components/auth/steps/MethodStep";
import StepIndicator from "../components/auth/StepIndicator";
import { DEFAULT_METHOD_ID } from "../constants/methods";
import { useAuth } from "../hooks/useAuth";
import AuthCenterLayout from "../layouts/AuthCenterLayout";
import { AuthError } from "../lib/authError";
import { paths } from "../router/paths";

const STEP_LABELS = ["Account", "Gemini key", "Method", "Apps"];

type Draft = AccountValues & {
  geminiKey: string;
  methodId: number;
  apps: number[];
};

const initialDraft: Draft = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  geminiKey: "",
  methodId: DEFAULT_METHOD_ID,
  apps: [],
  agreed: false,
};

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const toggleApp = (id: number) =>
    setDraft((d) => ({
      ...d,
      apps: d.apps.includes(id)
        ? d.apps.filter((a) => a !== id)
        : [...d.apps, id],
    }));

  const submit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { connectUrl } = await signup({
        fullName: draft.fullName,
        email: draft.email,
        password: draft.password,
        geminiKey: draft.geminiKey,
        methodId: draft.methodId,
        apps: draft.apps,
        acceptedTerms: draft.agreed,
      });
      if (connectUrl) window.location.assign(connectUrl);
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
        setEmailError(err.message);
        setStep(0);
      } else {
        setSubmitError(
          err instanceof AuthError
            ? err.message
            : "Something went wrong. Try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCenterLayout>
      <StepIndicator steps={STEP_LABELS} current={step} />

      {step === 0 && (
        <>
          <AccountStep
            values={draft}
            emailError={emailError}
            onChange={(p) => {
              patch(p);
              if ("email" in p) setEmailError(null);
            }}
            onNext={next}
            onGoogle={loginWithGoogle}
          />
          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              to={paths.login}
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Log in
            </Link>
          </p>
        </>
      )}

      {step === 1 && (
        <GeminiStep
          focusOnMount
          value={draft.geminiKey}
          onChange={(geminiKey) => patch({ geminiKey })}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 2 && (
        <MethodStep
          focusOnMount
          value={draft.methodId}
          onChange={(methodId) => patch({ methodId })}
          onNext={next}
          onBack={back}
        />
      )}

      {step === 3 && (
        <AppsStep
          focusOnMount
          selected={draft.apps}
          onToggle={toggleApp}
          onSubmit={submit}
          onBack={back}
          loading={submitting}
          error={submitError}
        />
      )}
    </AuthCenterLayout>
  );
}
