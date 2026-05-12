"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  watermark?: string;
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  loop = false,
  watermark = "CineAmore",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
  }, []);

  const handleTap = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
    togglePlay();
  }, [togglePlay]);

  return (
    <div
      className={cn("relative overflow-hidden bg-black", className)}
      onClick={handleTap}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={autoPlay}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        className="w-full h-full object-cover"
      />

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
              {playing ? (
                <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div
          className="h-full gradient-accent"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Watermark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 10, duration: 2 }}
        className="absolute bottom-6 right-4 text-white/40 text-xs font-medium tracking-wide pointer-events-none"
      >
        {watermark}
      </motion.div>
    </div>
  );
}
