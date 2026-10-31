import dns from "node:dns/promises";
import net from "node:net";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runTool, ToolError, type ToolDef } from "./_shared.js";

// SSRF Guard: never let the model reach private/internal addresses
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::1" || v === "::" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol))
    throw new ToolError("Only http(s) URLs are allowed.");
  const addrs = await dns.lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address)))
    throw new ToolError("That address is not allowed.");
  return url;
}

async function fetchText(
  raw: string,
): Promise<{ finalUrl: string; body: string; type: string }> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= 3; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "AmluminaAI/1.0 (study assistant)",
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
      },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = await assertPublicUrl(new URL(loc, url).toString());
      continue;
    }
    if (!res.ok) throw new ToolError(`Site returned HTTP ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/|json|xml/i.test(type))
      throw new ToolError(`Unsupported content type: ${type || "unknown"}`);

    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const c of res.body as any) {
      chunks.push(c);
      size += c.length;
      if (size > 1_000_000) break;
    }
    return {
      finalUrl: url.toString(),
      body: Buffer.concat(chunks).toString("utf8"),
      type,
    };
  }
  throw new ToolError("Too many redirects.");
}

const htmlToText = (html: string) =>
  html
    .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

export const webTools: ToolDef[] = [
  {
    appId: null,
    build: () =>
      tool(
        async ({ query }) =>
          runTool(async () => {
            const res = await fetch(
              `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
              {
                signal: AbortSignal.timeout(10_000),
                headers: {
                  "User-Agent": "Mozilla/5.0 (compatible; AmluminaAI/1.0)",
                },
              },
            );
            if (!res.ok)
              throw new ToolError(`Search failed (HTTP ${res.status}).`);
            const html = await res.text();
            const re =
              /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
            const results: { title: string; url: string; snippet: string }[] =
              [];
            let m: RegExpExecArray | null;
            while ((m = re.exec(html)) && results.length < 5) {
              let link = m[1];
              try {
                const u = new URL(
                  link.startsWith("//") ? "https:" + link : link,
                );
                link = u.searchParams.get("uddg") ?? u.toString();
              } catch {}
              results.push({
                title: htmlToText(m[2]),
                url: link,
                snippet: htmlToText(m[3]),
              });
            }
            if (!results.length)
              throw new ToolError(
                "No results (search may be blocked). Try a different query.",
              );
            return { results };
          }),
        {
          name: "web_search",
          description:
            "Search the web for current or factual information. Returns up to 5 results (title, url, snippet). Use web_fetch_page to read one.",
          schema: z.object({ query: z.string().describe("Search query") }),
        },
      ),
  },
  {
    appId: null,
    build: () =>
      tool(
        async ({ url }) =>
          runTool(async () => {
            const { finalUrl, body, type } = await fetchText(url);
            const isHtml = /html/i.test(type);
            const title = isHtml
              ? htmlToText(
                  /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1] ?? "",
                )
              : "";
            return {
              url: finalUrl,
              title,
              text: (isHtml ? htmlToText(body) : body).slice(0, 5000),
            };
          }),
        {
          name: "web_fetch_page",
          description:
            "Fetch a public web page and return its readable text (first ~5000 characters).",
          schema: z.object({ url: z.string().describe("Full http(s) URL") }),
        },
      ),
  },
];
