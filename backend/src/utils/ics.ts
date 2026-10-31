interface Ev {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
}

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
const stamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const dateOnly = (d: string) => d.replace(/-/g, "");
const nextDay = (d: string) =>
  dateOnly(
    new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000)
      .toISOString()
      .slice(0, 10),
  );

// lines over 75 characters are folded (counted in characters, which is close enough for typical text)
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
};

export function buildIcs(events: Ev[], calName: string): string {
  const now = stamp(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amlumina AI//Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(calName)}`,
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@amlumina`, `DTSTAMP:${now}`);
    if (e.allDay) {
      lines.push(
        `DTSTART;VALUE=DATE:${dateOnly(e.startAt)}`,
        `DTEND;VALUE=DATE:${nextDay(e.endAt)}`,
      ); // DTEND is exclusive
    } else {
      lines.push(`DTSTART:${stamp(e.startAt)}`, `DTEND:${stamp(e.endAt)}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
