import { useState } from "react";
import GeminiStep from "../components/auth/steps/GeminiStep";
import MethodStep from "../components/auth/steps/MethodStep";
import StepIndicator from "../components/auth/StepIndicator";
import Button from "../components/ui/Button";
import { DEFAULT_METHOD_ID } from "../constants/methods";
import { useAuth } from "../hooks/useAuth";
import AuthCenterLayout from "../layouts/AuthCenterLayout";
import { AuthError } from "../lib/authError";

type OnboardingStep = "gemini" | "method";
const LABELS: Record<OnboardingStep, string> = {
  gemini: "Gemini key",
  method: "Method",
};

export default function OnboardingPage() {
  const { user, saveGeminiKey, chooseMethod, logout } = useAuth();

  const [steps] = useState<OnboardingStep[]>(() => {
    const list: OnboardingStep[] = [];
    if (!user?.hasGeminiKey) list.push("gemini");
    if (user?.learningMethodId == null) list.push("method");
    return list;
  });
  const [index, setIndex] = useState(0);
  const [geminiKey, setGeminiKey] = useState("");
  const [methodId, setMethodId] = useState(DEFAULT_METHOD_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = steps[index];
  if (!current) return null;

  const nextLabel = index < steps.length - 1 ? "Continue" : "Finish";

  const save = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      setIndex((i) => i + 1);
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : "Could not save. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCenterLayout
      action={
        <Button variant="ghost" size="sm" onClick={logout}>
          Log out
        </Button>
      }
    >
      {steps.length > 1 && (
        <StepIndicator steps={steps.map((s) => LABELS[s])} current={index} />
      )}

      {current === "gemini" && (
        <GeminiStep
          focusOnMount
          value={geminiKey}
          onChange={setGeminiKey}
          onNext={() => save(() => saveGeminiKey(geminiKey.trim()))}
          nextLabel={nextLabel}
          loading={loading}
          error={error}
        />
      )}

      {current === "method" && (
        <MethodStep
          focusOnMount
          value={methodId}
          onChange={setMethodId}
          onNext={() => save(() => chooseMethod(methodId))}
          nextLabel={nextLabel}
          loading={loading}
          error={error}
        />
      )}
    </AuthCenterLayout>
  );
}
