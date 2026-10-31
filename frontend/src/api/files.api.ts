import { authFetch, request, toApiError } from "./client";

export interface Attachment {
  id: string;
  name: string;
  chars: number;
  truncated: boolean;
}

export const filesApi = {
  async upload(file: File): Promise<Attachment> {
    const body = new FormData();
    body.append("file", file);
    const res = await authFetch("/api/files", { method: "POST", body });
    const json = await res
      .clone()
      .json()
      .catch(() => null);
    if (res.ok && json?.success) return json.data as Attachment;
    throw await toApiError(res);
  },
  remove: (id: string) =>
    request<{ deleted: boolean }>(`/api/files/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
