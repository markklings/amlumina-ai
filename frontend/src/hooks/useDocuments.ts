import { documentsApi } from "../api/workspace.api";
import type { DocSummary } from "../types/document";
import { useResource } from "./useResource";

const EMPTY: DocSummary[] = [];

export const useDocuments = () =>
  useResource(
    (s) => documentsApi.list(s),
    EMPTY,
    (d) => d.length === 0,
  );
