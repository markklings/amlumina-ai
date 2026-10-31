import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuClock } from "react-icons/lu";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import AuthCenterLayout from "../layouts/AuthCenterLayout";
import { paths } from "../router/paths";

export default function SessionExpiredPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <AuthCenterLayout>
      <div className="flex animate-fade-up flex-col items-center gap-2 text-center">
        <LuClock className="size-7" />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Your session expired
        </h1>
        <p className="text-sm text-zinc-500">
          For your security you were logged out. Log in to continue.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-3"
          onClick={() => navigate(paths.login, { replace: true })}
        >
          Log in
        </Button>
      </div>
    </AuthCenterLayout>
  );
}
