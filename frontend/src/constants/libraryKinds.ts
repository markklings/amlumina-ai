import type { IconType } from "react-icons";
import { LuFileText, LuFolder, LuTable } from "react-icons/lu";
import type { LibraryKind } from "../types/library";

export const libraryKinds: Record<
  LibraryKind,
  { label: string; app: string; icon: IconType }
> = {
  doc: { label: "Docs", app: "Google Docs", icon: LuFileText },
  sheet: { label: "Sheets", app: "Google Sheets", icon: LuTable },
  folder: { label: "Folders", app: "Google Drive", icon: LuFolder },
};
