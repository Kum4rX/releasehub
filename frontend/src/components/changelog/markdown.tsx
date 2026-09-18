import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Minimal, dependency-free markdown renderer — enough for changelog content. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      nodes.push(
        <a key={key} href={linkMatch?.[2] ?? "#"} rel="noreferrer noopener">
          {linkMatch?.[1] ?? token}
        </a>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        code.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre key={`b${blocks.length}`}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = (heading[1] ?? "#").length;
      const text = heading[2] ?? "";
      const key = `b${blocks.length}`;
      const content = inline(text, key);
      if (level === 1) blocks.push(<h1 key={key}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key}>{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={key}>{content}</h3>);
      else blocks.push(<h4 key={key}>{content}</h4>);
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`b${blocks.length}`}>
          {items.map((item, index) => (
            <li key={index}>{inline(item, `b${blocks.length}-${index}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`b${blocks.length}`}>
          {items.map((item, index) => (
            <li key={index}>{inline(item, `b${blocks.length}-${index}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith(">")) {
        quote.push((lines[i] ?? "").replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote key={`b${blocks.length}`}>
          {inline(quote.join(" "), `b${blocks.length}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`b${blocks.length}`} />);
      i += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#|>|```|[-*]\s|\d+\.\s)/.test(lines[i] ?? "")) {
      paragraph.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push(<p key={`b${blocks.length}`}>{inline(paragraph.join(" "), `b${blocks.length}`)}</p>);
  }

  return <div className={cn("prose-release", className)}>{blocks}</div>;
}
