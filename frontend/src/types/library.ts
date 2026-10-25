export type LibraryKind = "doc" | "sheet" | "folder";

export interface LibraryItem {
  id: string;
  title: string;
  kind: LibraryKind;
  account: string; // Google account email it was created in
  createdAt: string;
  link: string;
}
