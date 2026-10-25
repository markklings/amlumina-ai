import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuMail } from "react-icons/lu";
import FormError from "../components/auth/FormError";
import TextField from "../components/auth/TextField";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import AuthSplitLayout from "../layouts/AuthSplitLayout";
import { validators } from "../lib/validators";
import { paths } from "../router/paths";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validators.email(email);
    setError(found);
    if (found) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      {sentTo ? (
        <div className="animate-fade-up">
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800">
            <LuMail className="size-5" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            If an account exists for{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {sentTo}
            </span>
            , we sent a link to reset your password.
          </p>
          <div className="mt-7 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate(paths.login)}
            >
              Back to login
            </Button>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setSentTo(null)}
            >
              Use a different email
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Enter your email and we will send you a reset link.
          </p>

          <form onSubmit={submit} noValidate className="mt-7 space-y-4">
            {formError && <FormError message={formError} />}
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              error={error}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Send reset link
            </Button>
          </form>

          <Link
            to={paths.login}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            <LuArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      )}
    </AuthSplitLayout>
  );
}
