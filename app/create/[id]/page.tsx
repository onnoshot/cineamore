"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/ui/video-player";
import { ShareActions } from "@/components/result/share-actions";
import { Button } from "@/components/ui/button";
import { useGenerationStore } from "@/store/generation-store";
import { hapticMedium } from "@/lib/utils/haptic";

export default function ResultPage() {
  const router = useRouter();
  const { finalVideoUrl, jobId, reset, phase } = useGenerationStore();

  useEffect(() => {
    if (!finalVideoUrl && phase !== "done") {
      router.replace("/create");
    }
  }, [finalVideoUrl, phase, router]);

  const handleRestart = () => {
    hapticMedium();
    reset();
    router.push("/create");
  };

  if (!finalVideoUrl) return null;

  return (
    <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Full-screen video */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-0"
      >
        <VideoPlayer
          src={finalVideoUrl}
          className="w-full h-full"
          autoPlay
          loop
          watermark="CineAmore"
        />
      </motion.div>

      {/* Top controls */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.16em" }}
          >
            CineAmore
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestart}
          >
            🔄 Yeniden Yarat
          </Button>
        </motion.div>
      </div>

      {/* Success overlay — brief */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
      >
        {/* subtle center glow on first load */}
      </motion.div>

      {/* Bottom actions panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 mt-auto"
      >
        <div
          className="p-5 pb-10"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.97) 100%)",
          }}
        >
          {/* Title */}
          <div className="mb-5 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-[22px] font-bold text-white"
              style={{ letterSpacing: "-0.01em" }}
            >
              Hikayeniz Hazır! 🌹
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-white/50 mt-1"
            >
              İndir veya paylaş · {jobId?.slice(0, 8)}
            </motion.p>
          </div>

          <ShareActions videoUrl={finalVideoUrl} />
        </div>
      </motion.div>
    </div>
  );
}
