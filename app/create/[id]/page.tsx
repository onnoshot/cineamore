"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/ui/video-player";
import { ShareActions } from "@/components/result/share-actions";
import { hapticMedium } from "@/lib/utils/haptic";
import { createClient } from "@/lib/supabase/client";

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) { router.replace("/create"); return; }

    fetch(`/api/result?jobId=${encodeURIComponent(jobId)}`)
      .then((r) => r.json())
      .then((d: { videoUrl?: string; error?: string }) => {
        if (d.videoUrl) setVideoUrl(d.videoUrl);
        else router.replace("/create");
      })
      .catch(() => router.replace("/create"))
      .finally(() => setLoading(false));
  }, [jobId, router]);

  const handleRestart = async () => {
    hapticMedium();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const res = await fetch(`/api/user-status?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.isVip && data.credits <= 0) { router.push("/credits"); return; }
        }
      }
    } catch { /* non-critical */ }
    router.push("/create");
  };

  if (loading) {
    return (
      <div className="page" style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
      </div>
    );
  }

  if (!videoUrl) return null;

  return (
    <div className="page">
      {/* Full-screen video */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-0"
      >
        <VideoPlayer src={videoUrl} className="w-full h-full" autoPlay loop watermark="CineAmore" />
      </motion.div>

      {/* Top controls */}
      <div className="relative z-10 flex items-center justify-between px-5 safe-top pt-4">
        <motion.span
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.16em" }}
        >
          CineAmore
        </motion.span>

        <motion.button
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRestart}
          className="h-9 px-4 rounded-xl glass text-white/80 text-sm font-medium flex items-center gap-2
                     cursor-pointer hover:bg-white/[0.08] transition-colors duration-200 focus:outline-none"
        >
          <RefreshIcon size={14} />
          Yeniden Yarat
        </motion.button>
      </div>

      {/* Bottom actions panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 mt-auto"
      >
        <div
          className="p-5 safe-bottom"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.97) 100%)",
          }}
        >
          <div className="mb-5 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-[22px] font-bold text-white"
              style={{ letterSpacing: "-0.01em" }}
            >
              Hikayeniz Hazır
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-white/50 mt-1"
            >
              İndir veya paylaş
            </motion.p>
          </div>
          <ShareActions videoUrl={videoUrl} />
        </div>
      </motion.div>
    </div>
  );
}

function RefreshIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
