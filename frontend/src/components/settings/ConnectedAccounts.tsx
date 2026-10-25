import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { getConnectableApp } from "../../constants/connectedApps";
import type { ConnectedAccount } from "../../types/user";
import FormError from "../auth/FormError";
import Button from "../ui/Button";

interface Props {
  accounts: ConnectedAccount[];
  onConnect: () => void;
  onDisconnect: (id: string) => Promise<void>;
}

export default function ConnectedAccounts({
  accounts,
  onConnect,
  onDisconnect,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disconnect = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await onDisconnect(id);
      setConfirmId(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not disconnect. Try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && <FormError message={error} />}

      {accounts.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
          No accounts connected yet.
        </p>
      )}

      <ul className="space-y-2">
        {accounts.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <p className="truncate text-sm font-medium">{a.email}</p>
            <p className="text-xs text-zinc-500">
              {a.type === "edu" ? "School account" : "Personal account"}
            </p>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {a.apps.map((id) => {
                const app = getConnectableApp(id);
                if (!app) return null;
                const Icon = app.icon;
                return (
                  <li
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  >
                    <Icon className="size-3.5" />
                    {app.short}
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex items-center justify-end gap-2">
              {confirmId === a.id ? (
                <>
                  <span className="mr-auto text-xs text-zinc-500">
                    Disconnect this account?
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === a.id}
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busyId === a.id}
                    onClick={() => disconnect(a.id)}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setConfirmId(a.id)}>
                  Disconnect
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Button className="w-full border-dashed" onClick={onConnect}>
        <LuPlus className="size-4" />
        Connect Google account
      </Button>
    </div>
  );
}
