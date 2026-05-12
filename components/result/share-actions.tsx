"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { hapticMedium, hapticSuccess } from "@/lib/utils/haptic";

interface ShareActionsProps {
  videoUrl: string;
}

export function ShareActions({ videoUrl }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    hapticMedium();
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cineamore-hikayem.mp4";
      a.click();
      URL.revokeObjectURL(url);
      hapticSuccess();
    } catch {
      window.open(videoUrl, "_blank");
    }
  };

  const handleShare = async (platform: "instagram" | "tiktok") => {
    hapticMedium();

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        const file = new File([blob], "cineamore.mp4", { type: "video/mp4" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "CineAmore — Aşk Hikayem",
            text: platform === "instagram"
              ? "✨ CineAmore ile yarattım"
              : "🎬 Aşk hikayem #CineAmore",
          });
          hapticSuccess();
          return;
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
        return;
      }
    }

    handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      hapticSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Primary: Download */}
      <Button size="lg" fullWidth onClick={handleDownload}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Videoyu İndir
      </Button>

      {/* Share row */}
      <div className="flex gap-3">
        <SharePlatformButton
          label="Instagram"
          emoji="📸"
          onClick={() => handleShare("instagram")}
          className="flex-1"
        />
        <SharePlatformButton
          label="TikTok"
          emoji="🎵"
          onClick={() => handleShare("tiktok")}
          className="flex-1"
        />
      </div>

      {/* Copy link feedback */}
      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-green-400"
          >
            ✓ Link kopyalandı
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SharePlatformButton({
  label,
  emoji,
  onClick,
  className,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button variant="secondary" size="lg" onClick={onClick} className={className}>
      <span>{emoji}</span>
      <span>{label}</span>
    </Button>
  );
}
