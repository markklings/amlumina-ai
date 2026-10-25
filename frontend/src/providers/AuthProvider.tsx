import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { accountApi } from "../api/account.api";
import { authApi } from "../api/auth.api";
import { setSessionExpiredHandler } from "../api/client";
import {
  toAccount,
  toAuthUser,
  type WireAccount,
  type WireTokens,
  type WireUser,
} from "../api/mappers";
import { REFRESH_KEY, tokenStore } from "../api/tokenStore";
import type { AuthUser, ConnectedAccount } from "../types/user";
import {
  AuthContext,
  type AuthContextValue,
  type SignupInput,
} from "./authContext";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(() => !!tokenStore.getRefresh());
  const [sessionExpired, setSessionExpired] = useState(false);

  const applyMe = useCallback(
    (me: { user: WireUser; connected_accounts: WireAccount[] }) => {
      setUser(toAuthUser(me.user));
      setAccounts(me.connected_accounts.map(toAccount));
    },
    [],
  );

  const refreshUser = useCallback(
    async () => applyMe(await authApi.me()),
    [applyMe],
  );

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setAccounts([]);
  }, []);

  const startSession = useCallback(
    async (user: WireUser, tokens: WireTokens) => {
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      setSessionExpired(false);
      try {
        await refreshUser(); // user + connected accounts
      } catch {
        setUser(toAuthUser(user));
      }
    },
    [refreshUser],
  );

  // the API client calls this when /refresh says the session is over
  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearSession();
      setSessionExpired(true);
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // restore the session on page load
  useEffect(() => {
    if (!tokenStore.getRefresh()) return;
    let active = true;
    refreshUser()
      .catch(() => {
        if (active) setSessionExpired(false); // a stale token on first load is just "logged out"
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  // logging out in another tab logs out this one too
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === REFRESH_KEY && e.newValue === null) {
        tokenStore.clearAccess();
        setUser(null);
        setAccounts([]);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await authApi.login(email.trim().toLowerCase(), password);
      await startSession(r.user, r.tokens);
    },
    [startSession],
  );

  // POST /signup, then POST /method/choose (the signup route has no method field)
  const signup = useCallback(async (input: SignupInput) => {
    const r = await authApi.signup({
      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      confirm_password: input.password,
      gemini_key: input.geminiKey.trim(),
      accepted_terms: input.acceptedTerms,
      apps: input.apps,
    });
    tokenStore.set(r.tokens.access_token, r.tokens.refresh_token);
    setSessionExpired(false);

    let methodId = r.user.learning_method_id;
    try {
      await accountApi.chooseMethod(input.methodId);
      methodId = input.methodId;
    } catch {
      /* the account exists: onboarding will ask for the method again */
    }
    setAccounts([]);
    setUser({ ...toAuthUser(r.user), learningMethodId: methodId });
    return { connectUrl: r.connect_url };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { url } = await authApi.googleUrl("login");
    window.location.assign(url);
  }, []);

  const completeGoogleLogin = useCallback(
    async (code: string) => {
      const r = await authApi.googleExchange(code);
      await startSession(r.user, r.tokens);
    },
    [startSession],
  );

  const logout = useCallback(() => {
    const refresh = tokenStore.getRefresh();
    clearSession();
    setSessionExpired(false);
    if (refresh) void authApi.logout(refresh).catch(() => {});
  }, [clearSession]);

  const saveGeminiKey = useCallback(async (key: string) => {
    await accountApi.saveGeminiKey(key.trim());
    setUser((u) => (u ? { ...u, hasGeminiKey: true } : u));
  }, []);

  const chooseMethod = useCallback(async (id: number) => {
    await accountApi.chooseMethod(id);
    setUser((u) => (u ? { ...u, learningMethodId: id } : u));
  }, []);

  const updateProfile = useCallback(async (fullName: string) => {
    const r = await accountApi.updateProfile(fullName.trim());
    setUser(toAuthUser(r.user));
  }, []);

  // the backend ends every other session and returns a fresh token pair for this one
  const changePassword = useCallback(async (current: string, next: string) => {
    const r = await accountApi.changePassword(current, next);
    tokenStore.set(r.tokens.access_token, r.tokens.refresh_token);
  }, []);

  const deleteAccount = useCallback(async () => {
    await accountApi.deleteAccount();
    clearSession();
    setSessionExpired(false);
  }, [clearSession]);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authApi.forgotPassword(email.trim().toLowerCase());
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await authApi.resetPassword(token, password);
  }, []);

  const connectAccount = useCallback(async (apps: number[]) => {
    const { url } = await authApi.googleUrl("connect", apps);
    window.location.assign(url);
  }, []);

  const disconnectAccount = useCallback(async (id: string) => {
    await authApi.disconnectAccount(id);
    setAccounts((list) => list.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accounts,
      loading,
      sessionExpired,
      login,
      signup,
      loginWithGoogle,
      completeGoogleLogin,
      logout,
      refreshUser,
      saveGeminiKey,
      chooseMethod,
      updateProfile,
      changePassword,
      deleteAccount,
      requestPasswordReset,
      resetPassword,
      connectAccount,
      disconnectAccount,
    }),
    [
      user,
      accounts,
      loading,
      sessionExpired,
      login,
      signup,
      loginWithGoogle,
      completeGoogleLogin,
      logout,
      refreshUser,
      saveGeminiKey,
      chooseMethod,
      updateProfile,
      changePassword,
      deleteAccount,
      requestPasswordReset,
      resetPassword,
      connectAccount,
      disconnectAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
