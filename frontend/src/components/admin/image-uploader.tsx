import { Image as ImageIcon, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const MAX_BYTES = 4 * 1024 * 1024;

export function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("That file type isn't supported. Use PNG, JPG, WebP or AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That image is ${formatBytes(file.size)}. Keep cover images under 4 MB.`);
      return;
    }
    setError(null);
    setMeta({ name: file.name, size: file.size });
    onChange(URL.createObjectURL(file));
  };

  if (value) {
    return (
      <div className="space-y-3">
        <div className="panel overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img src={value} alt="Cover image preview" className="aspect-[16/7] w-full object-cover" />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{meta?.name ?? "cover-image"}</p>
              <p className="text-mono-meta text-muted-foreground">
                {meta ? formatBytes(meta.size) : "Linked image"}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <RefreshCw className="size-3.5" /> Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  onChange(null);
                  setMeta(null);
                }}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-lg border border-dashed transition-colors",
          dragging ? "border-accent bg-accent/[0.06]" : "border-border bg-surface/50",
          error && "border-destructive/50",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex w-full flex-col items-center gap-2 px-6 py-9 text-center"
        >
          <span className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground">
            {dragging ? <UploadCloud className="size-4" /> : <ImageIcon className="size-4" />}
          </span>
          <span className="text-sm font-medium">Drag &amp; drop a cover image</span>
          <span className="text-caption text-muted-foreground">
            or click to browse · PNG, JPG, WebP up to 4 MB
          </span>
        </button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
