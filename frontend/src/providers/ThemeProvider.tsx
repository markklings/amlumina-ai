import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeContext";

const KEY = "lumi-theme";
const darkQuery = () => matchMedia("(prefers-color-scheme: dark)");

const readPreference = (): ThemePreference => {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" || saved === "system"
    ? saved
    : "system";
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches);

  useEffect(() => {
    const mq = darkQuery();
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  useEffect(() => {
    localStorage.setItem(KEY, preference);
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      toggle: () => setPreference(resolved === "dark" ? "light" : "dark"),
    }),
    [preference, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
