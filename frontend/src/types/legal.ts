export interface LegalSection {
  id: string;
  title: string;
  body: (string | string[])[];
}

export interface LegalDoc {
  title: string;
  summary: string;
  sections: LegalSection[];
}
