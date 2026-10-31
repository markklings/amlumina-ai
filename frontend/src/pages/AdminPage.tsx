import { Navigate } from "react-router-dom";
import { insightsApi } from "../api/insights.api";
import MiniBars from "../components/common/MiniBars";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { formatDate } from "../lib/dates";
import { formatNumber } from "../lib/format";
import { paths } from "../router/paths";
import type { AdminStats } from "../types/insights";

const EMPTY: AdminStats = {
  totals: {
    users: 0,
    verified: 0,
    chats: 0,
    messages: 0,
    documents: 0,
    errors7: 0,
  },
  daily: [],
  models: [],
  topToday: [],
  recentUsers: [],
};

export default function AdminPage() {
  const { user } = useAuth();
  const { status, data, refetch } = useResource(
    (s) => insightsApi.admin(s),
    EMPTY,
  );
  if (!user?.isAdmin) return <Navigate to={paths.chat} replace />;

  const t = data.totals;
  const cards: [string, number][] = [
    ["Users", t.users],
    ["Verified", t.verified],
    ["Chats", t.chats],
    ["Messages", t.messages],
    ["Documents", t.documents],
    ["Reply errors (7d)", t.errors7],
  ];
  const th = "py-2 pr-3 text-left text-xs font-medium text-zinc-500";

  return (
    <>
      <PageHeader
        title="Admin"
        description="Read-only overview. Chat content is never shown here."
      />
      <ResourceView
        status={status === "ready" ? "ready" : status}
        onRetry={refetch}
        skeleton={<Skeleton className="h-64 w-full" />}
        empty={null}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {cards.map(([k, v]) => (
              <div
                key={k}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-xs text-zinc-500">{k}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(v)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MiniBars
              dates
              label="Signups, last 14 days"
              items={data.daily.map((d) => ({ day: d.day, value: d.signups }))}
            />
            <MiniBars
              dates
              label="Tokens used, last 14 days"
              items={data.daily.map((d) => ({ day: d.day, value: d.tokens }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-xs font-medium text-zinc-500">
                Replies by model (7 days)
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.models.length ? (
                  data.models.map((m) => (
                    <li key={m.model} className="flex justify-between gap-3">
                      <span className="truncate">{m.model}</span>
                      <span className="tabular-nums">
                        {formatNumber(m.count)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500">No replies yet.</li>
                )}
              </ul>
            </section>
            <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-xs font-medium text-zinc-500">
                Top token users today
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.topToday.length ? (
                  data.topToday.map((u) => (
                    <li key={u.email} className="flex justify-between gap-3">
                      <span className="truncate">{u.email}</span>
                      <span className="tabular-nums">
                        {formatNumber(u.tokens)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500">No usage today.</li>
                )}
              </ul>
            </section>
          </div>

          <section className="overflow-x-auto rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-xs font-medium text-zinc-500">Newest users</h2>
            <table className="mt-2 w-full min-w-[520px] text-sm">
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Name</th>
                  <th className={th}>Sign-in</th>
                  <th className={th}>Verified</th>
                  <th className={th}>Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.recentUsers.map((u) => (
                  <tr key={u.email}>
                    <td className="max-w-48 truncate py-2 pr-3">{u.email}</td>
                    <td className="max-w-40 truncate py-2 pr-3">{u.name}</td>
                    <td className="py-2 pr-3">{u.provider}</td>
                    <td className="py-2 pr-3">{u.verified ? "Yes" : "No"}</td>
                    <td className="py-2 pr-3 text-zinc-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </ResourceView>
    </>
  );
}
