import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuCircleAlert } from "react-icons/lu";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import AuthCenterLayout from "../layouts/AuthCenterLayout";
import { paths } from "../router/paths";

const ERROR_TITLES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled",
  invalid_state: "This sign-in link expired",
  email_unverified: "Your Google email is not verified",
  user_not_found: "We could not find your account",
  no_apps_granted: "No apps were allowed",
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { completeGoogleLogin, loading } = useAuth();
  const started = useRef(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const error = params.get("error");
  const isConnect = params.get("mode") === "connect";
  // the one-time code arrives in the URL fragment
  const [code] = useState(() =>
    new URLSearchParams(window.location.hash.slice(1)).get("code"),
  );

  // sign-in: swap the one-time code for tokens (once, even under React StrictMode)
  useEffect(() => {
    if (started.current || error || isConnect || !code) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname); // remove the code from the address bar
    completeGoogleLogin(code)
      .then(() => navigate("/", { replace: true })) // the guards pick /chat or /onboarding
      .catch((e: unknown) =>
        setExchangeError(
          e instanceof Error ? e.message : "Google sign-in failed.",
        ),
      );
  }, [code, error, isConnect, completeGoogleLogin, navigate]);

  // connect: the page load already restored the session and the accounts, so just continue
  useEffect(() => {
    if (isConnect && !error && !loading)
      navigate(paths.chat, { replace: true, state: { openSettings: true } });
  }, [isConnect, error, loading, navigate]);

  // opened by hand with nothing to process
  useEffect(() => {
    if (!error && !isConnect && !code) navigate(paths.login, { replace: true });
  }, [error, isConnect, code, navigate]);

  if (error || exchangeError) {
    return (
      <AuthCenterLayout>
        <div className="flex animate-fade-up flex-col items-center gap-3 text-center">
          <LuCircleAlert className="size-7" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {exchangeError
              ? "Google sign-in failed"
              : (ERROR_TITLES[error!] ?? "Google sign-in failed")}
          </h1>
          <p className="text-sm text-zinc-500">
            {exchangeError ?? "Nothing was changed. You can try again."}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-2"
            onClick={() => navigate(paths.login, { replace: true })}
          >
            Back to login
          </Button>
        </div>
      </AuthCenterLayout>
    );
  }

  return (
    <AuthCenterLayout>
      <div className="flex animate-fade-in flex-col items-center gap-4 text-center">
        <Spinner />
        <p className="text-sm text-zinc-500">
          {isConnect ? "Connecting your apps…" : "Signing you in with Google…"}
        </p>
      </div>
    </AuthCenterLayout>
  );
}
