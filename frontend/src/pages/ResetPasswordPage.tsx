import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuCircleAlert, LuCircleCheck } from "react-icons/lu";
import FormError from "../components/auth/FormError";
import PasswordField from "../components/auth/PasswordField";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import AuthSplitLayout from "../layouts/AuthSplitLayout";
import { AuthError } from "../lib/authError";
import { validators } from "../lib/validators";
import { paths } from "../router/paths";

type Problem = "invalid" | "expired" | null;

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [problem, setProblem] = useState<Problem>(token ? null : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);

    const found = {
      password: validators.password(password) ?? undefined,
      confirm: validators.confirmPassword(confirm, password) ?? undefined,
    };
    setErrors(found);
    if (found.password || found.confirm) return;

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof AuthError && err.code === "RESET_TOKEN_EXPIRED")
        setProblem("expired");
      else if (err instanceof AuthError && err.code === "INVALID_RESET_TOKEN")
        setProblem("invalid");
      else setFormError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (problem) {
    return (
      <AuthSplitLayout>
        <div className="animate-fade-up">
          <LuCircleAlert className="size-7" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {problem === "expired"
              ? "This link has expired"
              : "This link is invalid"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Reset links work once and expire. Request a new one to continue.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-7 w-full"
            onClick={() => navigate(paths.forgot)}
          >
            Request a new link
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  if (done) {
    return (
      <AuthSplitLayout>
        <div className="animate-fade-up">
          <LuCircleCheck className="size-7" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Password updated
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            You can now log in with your new password.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-7 w-full"
            onClick={() => navigate(paths.login)}
          >
            Log in
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Choose a password with at least 8 characters.
        </p>

        <form onSubmit={submit} noValidate className="mt-7 space-y-4">
          {formError && <FormError message={formError} />}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            error={errors.password}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            error={errors.confirm}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Update password
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
