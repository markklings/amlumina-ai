import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Divider from "../components/auth/Divider";
import FormError from "../components/auth/FormError";
import GoogleButton from "../components/auth/GoogleButton";
import PasswordField from "../components/auth/PasswordField";
import TextField from "../components/auth/TextField";
import Button from "../components/ui/Button";
import { APP_NAME } from "../constants/app";
import { useAuth } from "../hooks/useAuth";
import AuthSplitLayout from "../layouts/AuthSplitLayout";
import { AuthError } from "../lib/authError";
import { validators } from "../lib/validators";
import { paths } from "../router/paths";
import LegalLink from "../components/auth/LegalLink";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailError = validators.email(email) ?? undefined;
    const passwordError = password ? undefined : "Enter your password";
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Log in to keep studying with {APP_NAME}.
        </p>

        <div className="mt-7 space-y-4">
          <GoogleButton onClick={loginWithGoogle} />
          <Divider />

          <form onSubmit={submit} noValidate className="space-y-4">
            {formError && <FormError message={formError} />}
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
            />
            <PasswordField
              label="Password"
              labelAction={
                <Link
                  to={paths.forgot}
                  className="text-xs font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
                >
                  Forgot Password?
                </Link>
              }
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Log in
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          By continuing, you agree to our{" "}
          <LegalLink to={paths.terms}>Terms of Use</LegalLink> and{" "}
          <LegalLink to={paths.privacy}>Privacy &amp; Data</LegalLink>.
        </p>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New to {APP_NAME}?{" "}
          <Link
            to={paths.signup}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
