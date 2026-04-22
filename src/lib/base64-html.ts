export type Match = { keyPath: string; original: string; decoded: string };

export const CHARSETS = [
  { value: "utf-8", label: "UTF-8" },
  { value: "windows-874", label: "Windows-874 (Thai)" },
  { value: "tis-620", label: "TIS-620 (Thai)" },
  { value: "windows-1252", label: "Windows-1252 (Western)" },
  { value: "iso-8859-1", label: "ISO-8859-1 (Latin-1)" },
  { value: "windows-1251", label: "Windows-1251 (Cyrillic)" },
  { value: "shift_jis", label: "Shift-JIS (Japanese)" },
  { value: "euc-kr", label: "EUC-KR (Korean)" },
  { value: "gbk", label: "GBK (Chinese Simplified)" },
] as const;

export type Charset = (typeof CHARSETS)[number]["value"];

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const HTML_TAG_RE = /<\s*(!doctype|html|head|body|div|table|p|span|a|h[1-6]|ul|ol|li|br|img|section|article|header|footer|main|nav|form|input|button|style|script)\b[^>]*>/i;

export function decodeIfBase64Html(value: unknown, charset: Charset = "utf-8"): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s.length < 20) return null;
  if (s.length % 4 !== 0) return null;
  if (!BASE64_RE.test(s)) return null;

  let decoded: string;
  try {
    const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    decoded = new TextDecoder(charset).decode(bytes);
  } catch {
    return null;
  }

  return HTML_TAG_RE.test(decoded) ? decoded : null;
}

export function findBase64HtmlValues(root: unknown, charset: Charset = "utf-8"): Match[] {
  const results: Match[] = [];

  const walk = (node: unknown, path: string) => {
    if (node === null || node === undefined) return;

    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }

    if (typeof node === "object") {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        const nextPath = path ? `${path}.${key}` : key;
        walk(val, nextPath);
      }
      return;
    }

    const decoded = decodeIfBase64Html(node, charset);
    if (decoded !== null) {
      results.push({ keyPath: path, original: node as string, decoded });
    }
  };

  walk(root, "");
  return results;
}
