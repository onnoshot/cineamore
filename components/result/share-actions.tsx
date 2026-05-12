"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticMedium, hapticSuccess } from "@/lib/utils/haptic";

interface ShareActionsProps {
  videoUrl: string;
}

export function ShareActions({ videoUrl }: ShareActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ─── Download ─── */
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

  /* ─── Native Share (covers Instagram, TikTok, WhatsApp…) ─── */
  const handleNativeShare = async () => {
    if (sharing) return;
    hapticMedium();
    setSharing(true);
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        const file = new File([blob], "cineamore.mp4", { type: "video/mp4" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "CineAmore — Aşk Hikayem",
            text: "CineAmore ile sinematik aşk hikayemi yarattım 🎬",
          });
          hapticSuccess();
          return;
        }
        // Fallback: share URL
        await navigator.share({
          title: "CineAmore — Aşk Hikayem",
          text: "CineAmore ile sinematik aşk hikayemi yarattım 🎬",
          url: videoUrl,
        });
        hapticSuccess();
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") await handleCopyLink();
    } finally {
      setSharing(false);
    }
  };

  /* ─── X / Twitter ─── */
  const handleX = () => {
    hapticMedium();
    const text = encodeURIComponent("CineAmore ile sinematik aşk hikayemi yarattım 🎬 #CineAmore");
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  /* ─── Facebook ─── */
  const handleFacebook = () => {
    hapticMedium();
    const u = encodeURIComponent(videoUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank");
  };

  /* ─── Copy link ─── */
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
      {/* Primary row */}
      <div className="flex gap-3">
        <PrimaryBtn
          loading={downloading}
          onClick={handleDownload}
          icon={<DownloadIcon />}
          label="İndir"
          gradient="linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)"
        />
        <PrimaryBtn
          loading={sharing}
          onClick={handleNativeShare}
          icon={<ShareIcon />}
          label="Paylaş"
          gradient="linear-gradient(135deg, #0A84FF 0%, #30D158 100%)"
        />
      </div>

      {/* Secondary icon row */}
      <div className="flex gap-2">
        <IconBtn onClick={handleX} label="X" icon={<XIcon />} />
        <IconBtn onClick={handleFacebook} label="Facebook" icon={<FBIcon />} />
        <IconBtn onClick={handleCopyLink} label={copied ? "Kopyalandı!" : "Link Kopyala"} icon={copied ? <CheckIcon /> : <LinkIcon />} highlight={copied} />
      </div>

      {/* Copied feedback */}
      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-[12px]"
            style={{ color: "#30D158" }}
          >
            Link panoya kopyalandı
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Primary Button ─── */
function PrimaryBtn({
  loading, onClick, icon, label, gradient,
}: {
  loading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  gradient: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      className="flex-1 h-[52px] rounded-[16px] flex items-center justify-center gap-2.5
                 text-white font-semibold text-[15px] cursor-pointer
                 disabled:opacity-50 disabled:pointer-events-none focus:outline-none"
      style={{ background: gradient }}
    >
      {loading ? <Spinner /> : icon}
      <span>{loading ? "…" : label}</span>
    </motion.button>
  );
}

/* ─── Icon Button ─── */
function IconBtn({
  onClick, icon, label, highlight,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex-1 h-12 rounded-[14px] flex flex-col items-center justify-center gap-0.5
                 cursor-pointer focus:outline-none transition-colors duration-200"
      style={{
        background: highlight ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${highlight ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.08)"}`,
        color: highlight ? "#30D158" : "rgba(255,255,255,0.65)",
      }}
    >
      {icon}
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
    </motion.button>
  );
}

/* ─── Icons ─── */
function DownloadIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FBIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
