import { Navigate, Outlet } from "react-router-dom";
import Splash from "../components/common/Splash";
import { useAuth } from "../hooks/useAuth";
import { isOnboarded, nextPathFor, paths } from "./paths";

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to={nextPathFor(user)} replace /> : <Outlet />;
}

export function RequireAuth() {
  const { user, loading, sessionExpired } = useAuth();
  if (loading) return <Splash />;
  if (!user)
    return (
      <Navigate
        to={sessionExpired ? paths.sessionExpired : paths.login}
        replace
      />
    );
  return <Outlet />;
}

export function OnboardingOnly() {
  const { user } = useAuth();
  return user && isOnboarded(user) ? (
    <Navigate to={paths.chat} replace />
  ) : (
    <Outlet />
  );
}

export function RequireOnboarded() {
  const { user } = useAuth();
  return user && !isOnboarded(user) ? (
    <Navigate to={paths.onboarding} replace />
  ) : (
    <Outlet />
  );
}
