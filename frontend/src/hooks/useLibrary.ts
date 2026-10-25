import { libraryApi } from "../api/data.api";
import type { LibraryItem } from "../types/library";
import { useResource } from "./useResource";

const EMPTY: LibraryItem[] = [];

export const useLibrary = () =>
  useResource(
    (signal) => libraryApi.list(signal),
    EMPTY,
    (d) => d.length === 0,
  );
