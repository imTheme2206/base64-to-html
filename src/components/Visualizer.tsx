import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findBase64HtmlValues, type Match, type Charset, CHARSETS } from "@/lib/base64-html";

type ParseState =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "ok"; matches: Match[] };

function parse(input: string, charset: Charset): ParseState {
  if (!input.trim()) return { kind: "empty" };
  try {
    const data = JSON.parse(input);
    return { kind: "ok", matches: findBase64HtmlValues(data, charset) };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export function Visualizer() {
  const [input, setInput] = useState("");
  const [charset, setCharset] = useState<Charset>("utf-8");
  const state = useMemo(() => parse(input, charset), [input, charset]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Base64 HTML Visualizer</h1>
        <p className="text-sm text-muted-foreground">
          Paste an API JSON response. Base64-encoded HTML values are detected and rendered automatically.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="charset-select" className="shrink-0">Decoding charset</Label>
        <Select value={charset} onValueChange={(v) => setCharset(v as Charset)}>
          <SelectTrigger id="charset-select" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHARSETS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="json-input">JSON Input</Label>
        <Textarea
          id="json-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "PGgxPkhlbGxvPC9oMT4="}'
          className="h-52 font-mono text-xs resize-none"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          {state.kind === "empty" && "Waiting for input."}
          {state.kind === "error" && (
            <span className="text-destructive">JSON error: {state.message}</span>
          )}
          {state.kind === "ok" && (
            state.matches.length === 0
              ? "No base64 HTML values found."
              : `${state.matches.length} match${state.matches.length === 1 ? "" : "es"} found.`
          )}
        </p>
      </div>

      {state.kind === "ok" && state.matches.length > 0 && (
        <div className="space-y-6">
          {state.matches.map((m, i) => (
            <MatchCard key={`${m.keyPath}-${i}`} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono font-normal text-muted-foreground">
          {match.keyPath || "(root)"}
        </CardTitle>
        <CardDescription>Base64-encoded HTML value</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 h-[480px] border-t">
          <div className="overflow-auto border-r p-4 bg-muted/30">
            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground m-0">
              {match.original}
            </pre>
          </div>
          <iframe
            title={`preview-${match.keyPath}`}
            srcDoc={match.decoded}
            sandbox=""
            className="w-full h-full border-0 bg-white rounded-br-xl"
          />
        </div>
      </CardContent>
    </Card>
  );
}
