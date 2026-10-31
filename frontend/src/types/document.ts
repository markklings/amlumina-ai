export interface DocSummary {
  id: string;
  title: string;
  excerpt: string;
  source: "user" | "lumi";
  createdAt: string;
  updatedAt: string;
}

export interface DocFull {
  id: string;
  title: string;
  html: string;
  source: "user" | "lumi";
  createdAt: string;
  updatedAt: string;
}
