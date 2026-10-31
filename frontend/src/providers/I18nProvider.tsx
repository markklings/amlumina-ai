import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  en,
  type DictKey,
  type LangCode,
} from "../i18n/dictionaries";
import { I18nContext } from "../i18n/context";

const KEY = "lumi-lang";
const read = (): LangCode => {
  try {
    return localStorage.getItem(KEY) === "fil" ? "fil" : "en";
  } catch {
    return "en";
  }
};

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(read);

  useEffect(() => {
    document.documentElement.lang = lang === "fil" ? "fil" : "en";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* storage blocked */
    }
  }, [lang]);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string>) => {
      let s = dictionaries[lang][key] ?? en[key];
      for (const [k, v] of Object.entries(vars ?? {}))
        s = s.replaceAll(`{${k}}`, v);
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang: setLangState, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
