import { useId, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadSiteVideo } from "@/lib/image-upload";

/**
 * Video picker for the dashboard: choose a file from the device (uploaded to
 * the studio media store) or paste a direct link. Shows a small preview so the
 * admin can confirm the clip plays before saving.
 */
export function VideoField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  description?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const baseId = useId();
  const id = `${baseId}-video`;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file (.mp4, .webm or .mov).");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error("That video is larger than 200 MB. Please compress it first.");
      return;
    }
    setLoading(true);
    try {
      const url = await uploadSiteVideo(file);
      onChange(url);
      toast.success("Video uploaded. Remember to save.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload that video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Choose a file, or paste a direct .mp4 link"
        />
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          ref={fileInput}
          onChange={pick}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Uploading…" : "Choose file"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            aria-label={`Clear ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {description ?? "MP4 or WebM works everywhere. Page links (YouTube, Google Drive) will not play."}
      </p>
      {value && (
        <video
          key={value}
          src={value}
          controls
          muted
          playsInline
          preload="metadata"
          className="h-40 max-w-full rounded-lg border border-border bg-muted object-contain"
        />
      )}
    </div>
  );
}
