import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LuCircleCheck } from "react-icons/lu";
import { ApiError, retryAfterOf } from "../api/ApiError";
import { authApi } from "../api/auth.api";
import FormError from "../components/auth/FormError";
import TextField from "../components/auth/TextField";
import InlineStatus from "../components/common/InlineStatus";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import AuthCenterLayout from "../layouts/AuthCenterLayout";
import { paths } from "../router/paths";

export default function VerifyEmailPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  if (user?.emailVerified) {
    return (
      <AuthCenterLayout>
        <div className="flex animate-fade-up flex-col items-center gap-2 text-center">
          <LuCircleCheck className="size-7" />
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Email verified
          </h1>
          <p className="text-sm text-zinc-500">
            Thanks. Your email address is confirmed.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-3"
            onClick={() => navigate(paths.chat, { replace: true })}
          >
            Continue
          </Button>
        </div>
      </AuthCenterLayout>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    if (!/^\d{6}$/.test(code)) {
      setFieldError("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      await authApi.verifyEmail(code);
      await refreshUser(); // flips emailVerified, which shows the success view
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not verify. Try again.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setFormError(null);
    setNotice(null);
    setSending(true);
    try {
      await authApi.sendVerifyCode();
      setNotice("A new code is on its way.");
      setWait(60);
    } catch (err) {
      if (err instanceof ApiError && err.code === "OTP_RESEND_WAIT")
        setWait(retryAfterOf(err) ?? 60);
      else
        setFormError(
          err instanceof Error
            ? err.message
            : "Could not send a code. Try again.",
        );
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCenterLayout
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate(paths.chat)}>
          Skip for now
        </Button>
      }
    >
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto max-w-sm animate-fade-up"
      >
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Enter the 6-digit code we sent to {user?.email ?? "your email"}.
        </p>

        <div className="mt-5 space-y-3">
          {formError && <FormError message={formError} />}
          <TextField
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center text-xl tracking-[0.5em]"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setFieldError(null);
            }}
            error={fieldError}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={verifying}
          >
            Verify
          </Button>
          <div className="flex items-center justify-between gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={resend}
              loading={sending}
              disabled={wait > 0}
            >
              {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
            </Button>
            {notice && <InlineStatus>{notice}</InlineStatus>}
          </div>
        </div>
      </form>
    </AuthCenterLayout>
  );
}
