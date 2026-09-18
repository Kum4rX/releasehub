import {
  Bold,
  Code2,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Quote,
} from "lucide-react";
import { useRef } from "react";

import { Markdown } from "@/components/changelog/markdown";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Tool = {
  label: string;
  icon: typeof Bold;
  wrap: [string, string];
  placeholder: string;
};

const tools: Tool[] = [
  { label: "Bold", icon: Bold, wrap: ["**", "**"], placeholder: "bold text" },
  { label: "Italic", icon: Italic, wrap: ["*", "*"], placeholder: "italic text" },
  { label: "Heading", icon: Heading2, wrap: ["\n## ", "\n"], placeholder: "Section heading" },
  { label: "Link", icon: Link2, wrap: ["[", "](https://)"], placeholder: "link text" },
  { label: "Inline code", icon: Code2, wrap: ["`", "`"], placeholder: "code" },
  { label: "Quote", icon: Quote, wrap: ["\n> ", "\n"], placeholder: "Quoted note" },
  { label: "List", icon: List, wrap: ["\n- ", "\n"], placeholder: "List item" },
  { label: "Image", icon: ImageIcon, wrap: ["![", "](https://)"], placeholder: "alt text" },
];

export function MarkdownEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: string | undefined;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyTool = (tool: Tool) => {
    const el = ref.current;
    const [before, after] = tool.wrap;
    if (!el) {
      onChange(`${value}${before}${tool.placeholder}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || tool.placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length;
      el.setSelectionRange(caret, caret + selected.length);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-surface/60 p-1">
          {tools.map((tool) => (
            <Tooltip key={tool.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => applyTool(tool)}
                  aria-label={tool.label}
                >
                  <tool.icon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          ))}
          <span className="ml-auto pr-1.5 text-mono-meta text-muted-foreground">
            {value.trim() ? `${value.trim().split(/\s+/).length} words` : "0 words"}
          </span>
        </div>

        <Textarea
          ref={ref}
          id="content"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "content-error" : undefined}
          placeholder={"# Update title\n\nWhat changed and why it matters…"}
          className="min-h-[22rem] resize-y font-mono text-[0.8125rem] leading-relaxed lg:min-h-[30rem]"
        />
        {error ? (
          <p id="content-error" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Live preview</TabsTrigger>
            <TabsTrigger value="markdown">Raw markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="panel min-h-[22rem] overflow-x-auto p-5 lg:min-h-[30rem]">
              {value.trim() ? (
                <Markdown source={value} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing on the left to see a live preview of your update.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="markdown">
            <pre className="panel min-h-[22rem] overflow-x-auto p-5 font-mono text-[0.75rem] whitespace-pre-wrap text-muted-foreground lg:min-h-[30rem]">
              {value || "—"}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
