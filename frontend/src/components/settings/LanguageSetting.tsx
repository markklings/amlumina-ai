import { accountApi } from "../../api/account.api";
import { useI18n } from "../../hooks/useI18n";
import { LANGUAGES, type LangCode } from "../../i18n/dictionaries";
import { cn } from "../../lib/cn";

export default function LanguageSetting() {
  const { lang, setLang, t } = useI18n();

  const choose = (code: LangCode, aiName: string) => {
    setLang(code);
    void accountApi.setLanguage(aiName).catch(() => {}); // the UI works even if saving for the AI fails
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t("settings.language")}
        className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
      >
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={lang === l.code}
            onClick={() => choose(l.code, l.aiName)}
            className={cn(
              "h-8 rounded-md border text-xs font-medium transition-colors",
              lang === l.code
                ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">{t("settings.languageHint")}</p>
    </div>
  );
}
