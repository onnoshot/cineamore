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
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    hapticMedium();
    setDownloading(true);
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
    } finally {
      setDownloading(false);
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
            text: platform === "instagram" ? "CineAmore ile yarattım" : "Aşk hikayem #CineAmore",
          });
          hapticSuccess();
          return;
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") handleCopyLink();
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
    } catch { /* silent */ }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button size="lg" fullWidth onClick={handleDownload} loading={downloading}
        icon={<DownloadIcon />}>
        Videoyu İndir
      </Button>

      <div className="flex gap-3">
        <PlatformButton
          icon={<InstagramIcon />}
          label="Instagram"
          onClick={() => handleShare("instagram")}
        />
        <PlatformButton
          icon={<TikTokIcon />}
          label="TikTok"
          onClick={() => handleShare("tiktok")}
        />
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-green-400"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Link kopyalandı
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlatformButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="flex-1 h-14 rounded-2xl glass flex items-center justify-center gap-2.5
                 text-white/80 font-medium text-[15px] cursor-pointer
                 hover:bg-white/[0.08] transition-colors duration-200 focus:outline-none"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

/* ─── SVG Icons ─── */
function DownloadIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}
