export const REFRESH_KEY = "lumi-refresh-token";

let access: string | null = null;

export const tokenStore = {
  getAccess: () => access,
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set(accessToken: string, refreshToken: string) {
    access = accessToken;
    try {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
      /* storage blocked: session lasts until reload */
    }
  },
  clearAccess() {
    access = null;
  },
  clear() {
    access = null;
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
};
