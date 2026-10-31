import { createContext } from "react";
import type { DictKey, LangCode } from "./dictionaries";

export interface I18nValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: DictKey, vars?: Record<string, string>) => string;
}
export const I18nContext = createContext<I18nValue | null>(null);
