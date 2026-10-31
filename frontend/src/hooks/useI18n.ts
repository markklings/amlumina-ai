import { useContext } from "react";
import { I18nContext } from "../i18n/context";
import type { DictKey } from "../i18n/dictionaries";

export type { DictKey };

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
