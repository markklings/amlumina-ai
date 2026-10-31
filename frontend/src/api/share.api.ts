import { request } from "./client";

export type ShareKind = "doc" | "deck";
const e = encodeURIComponent;
interface State {
  shared: boolean;
  token: string | null;
}

export const sharesApi = {
  status: (kind: ShareKind, id: string) =>
    request<State>(`/api/shares/${kind}/${e(id)}`),
  enable: (kind: ShareKind, id: string) =>
    request<State>(`/api/shares/${kind}/${e(id)}`, {
      method: "POST",
      body: {},
    }),
  disable: (kind: ShareKind, id: string) =>
    request<State>(`/api/shares/${kind}/${e(id)}`, { method: "DELETE" }),
};

export const publicApi = {
  doc: (token: string, signal?: AbortSignal) =>
    request<{ title: string; html: string; updatedAt: string }>(
      `/api/public/doc/${e(token)}`,
      { auth: false, signal },
    ),
  deck: (token: string, signal?: AbortSignal) =>
    request<{ title: string; cards: { front: string; back: string }[] }>(
      `/api/public/deck/${e(token)}`,
      { auth: false, signal },
    ),
};
