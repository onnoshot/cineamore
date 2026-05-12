"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/ui/video-player";
import { ShareActions } from "@/components/result/share-actions";
import { useGenerationStore } from "@/store/generation-store";
import { hapticMedium } from "@/lib/utils/haptic";

export default function ResultPage() {
  const router = useRouter();
  const { finalVideoUrl, jobId, reset, phase } = useGenerationStore();

  useEffect(() => {
    if (!finalVideoUrl && phase !== "done") router.replace("/create");
  }, [finalVideoUrl, phase, router]);

  const handleRestart = () => {
    hapticMedium();
    reset();
    router.push("/create");
  };

  if (!finalVideoUrl) return null;

  return (
    <div className="page">
      {/* Full-screen video */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-0"
      >
        <VideoPlayer src={finalVideoUrl} className="w-full h-full" autoPlay loop watermark="CineAmore" />
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
          <ShareActions videoUrl={finalVideoUrl} />
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
