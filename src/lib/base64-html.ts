export type Match = { keyPath: string; original: string; decoded: string };

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const HTML_TAG_RE = /<\s*(!doctype|html|head|body|div|table|p|span|a|h[1-6]|ul|ol|li|br|img|section|article|header|footer|main|nav|form|input|button|style|script)\b[^>]*>/i;

export function decodeIfBase64Html(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s.length < 20) return null;
  if (s.length % 4 !== 0) return null;
  if (!BASE64_RE.test(s)) return null;

  let decoded: string;
  try {
    decoded = atob(s);
  } catch {
    return null;
  }

  return HTML_TAG_RE.test(decoded) ? decoded : null;
}

export function findBase64HtmlValues(root: unknown): Match[] {
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

    const decoded = decodeIfBase64Html(node);
    if (decoded !== null) {
      results.push({ keyPath: path, original: node as string, decoded });
    }
  };

  walk(root, "");
  return results;
}
