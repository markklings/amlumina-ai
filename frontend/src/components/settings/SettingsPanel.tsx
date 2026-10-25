import { useEffect, useRef } from "react";
import { LuLogOut, LuX, LuChevronRight } from "react-icons/lu";
import { cn } from "../../lib/cn";
import type { ConnectedAccount, User } from "../../types/user";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
// import IconButton from "../ui/IconButton";
import AppearanceSetting from "./AppearanceSetting";
import ConnectedAccounts from "./ConnectedAccounts";
import GeminiKeySetting from "./GeminiKeySetting";
import HelpLinks from "./HelpLinks";
import SettingsSection from "./SettingsSection";

interface Props {
  open: boolean;
  user: User;
  accounts: ConnectedAccount[];
  hasGeminiKey: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: (id: string) => Promise<void>;
  onSaveGeminiKey: (key: string) => Promise<void>;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export default function SettingsPanel(p: Props) {
  const { open, onClose } = p;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[92vw] flex-col border-r border-zinc-200 bg-white transition-[transform,visibility] duration-200 dark:border-zinc-800 dark:bg-black",
          open ? "translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold tracking-tight">Settings</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            title="Close settings"
            className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
          >
            <LuX className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800">
          <button
            type="button"
            onClick={p.onOpenProfile}
            aria-label="Open profile and security"
            className="flex w-full items-center gap-3 px-4 py-5 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-950 dark:focus-visible:outline-zinc-100"
          >
            <Avatar name={p.user.fullName} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {p.user.fullName}
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {p.user.email}
              </span>
            </span>
            <LuChevronRight className="size-4 shrink-0 text-zinc-400" />
          </button>

          <SettingsSection
            title="Connected apps"
            description="Link your personal and school Google accounts. Lumi only uses the apps you enable."
          >
            <ConnectedAccounts
              accounts={p.accounts}
              onConnect={p.onConnect}
              onDisconnect={p.onDisconnect}
            />
          </SettingsSection>

          <SettingsSection title="Appearance">
            <AppearanceSetting />
          </SettingsSection>

          <SettingsSection title="Gemini API key">
            <GeminiKeySetting
              hasKey={p.hasGeminiKey}
              onSave={p.onSaveGeminiKey}
            />
          </SettingsSection>

          <SettingsSection title="More">
            <HelpLinks />
          </SettingsSection>
        </div>

        <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button className="w-full" onClick={p.onLogout}>
            <LuLogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
