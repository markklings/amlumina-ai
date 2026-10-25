export function normalizeContent(content: string): string {
  const t = content.trim();
  if (!/^[[{]/.test(t)) return content;

  let body = t;
  try {
    body = JSON.stringify(JSON.parse(t), null, 2); // complete JSON gets pretty-printed
  } catch {
    /* partial JSON while streaming: show as is */
  }
  const longestRun = Math.max(
    0,
    ...(body.match(/`+/g) ?? []).map((r) => r.length),
  );
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return `${fence}json\n${body}\n${fence}`;
}
