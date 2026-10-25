export async function readSse(
  res: Response,
  onEvent: (event: string, data: any) => void,
): Promise<void> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value.replace(/\r\n/g, "\n");

    let end: number;
    while ((end = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, end);
      buf = buf.slice(end + 2);

      let event = "message";
      const data: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (!data.length) continue;
      try {
        onEvent(event, JSON.parse(data.join("\n")));
      } catch {
        /* ignore a malformed frame */
      }
    }
  }
}
