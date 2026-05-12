"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressOrchestrator } from "@/components/generation/progress-orchestrator";
import { StatusText } from "@/components/generation/status-text";
import { useGenerationStore } from "@/store/generation-store";
import { Button } from "@/components/ui/button";

export default function GeneratingPage() {
  const router = useRouter();
  const { scenes, phase, finalVideoUrl, overallError, jobId } = useGenerationStore();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [tabWarning, setTabWarning] = useState(false);

  const completedScenes = scenes.filter((s) => s.status === "done").length;
  const isActive = phase === "generating" || phase === "finalizing";

  // Screen Wake Lock — prevent screen from sleeping
  useEffect(() => {
    if (!isActive) return;

    const request = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        } catch { /* not critical */ }
      }
    };

    request();

    // Re-request when tab becomes visible again (wake lock auto-releases on hide)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setTabWarning(false);
        request();
      } else {
        setTabWarning(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [isActive]);

  useEffect(() => {
    if (phase === "done" && finalVideoUrl && jobId) router.replace(`/create/${jobId}`);
  }, [phase, finalVideoUrl, jobId, router]);

  useEffect(() => {
    if (phase === "idle") router.replace("/create");
  }, [phase, router]);

  return (
    <div className="page">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(255,55,95,0.15) 0%, transparent 65%)",
              "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(191,90,242,0.15) 0%, transparent 65%)",
              "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(255,55,95,0.15) 0%, transparent 65%)",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {isActive && <ProgressOrchestrator />}

      {/* Tab switched warning */}
      <AnimatePresence>
        {tabWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-5 py-3"
            style={{ background: "rgba(255,159,10,0.18)", borderBottom: "1px solid rgba(255,159,10,0.3)" }}
          >
            <svg width="14" height="14" fill="none" stroke="#FF9F0A" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: "#FF9F0A" }}>
              Sayfayı açık tut — işlem devam ediyor
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {overallError ? (
        <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 gap-8">

          {/* Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          >
            <RingCounter completed={completedScenes} total={4} active={isActive} />
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <StatusText phase={completedScenes} />
          </motion.div>

          {/* 4 scene dots */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3"
          >
            {scenes.map((s, i) => (
              <SceneDot key={i} index={i} status={s.status} />
            ))}
          </motion.div>

          {/* Time hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-1.5"
          >
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }} className="text-center">
              Ortalama 3–5 dakika
            </p>
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              </svg>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }} className="text-center">
                Bu sayfayı açık tutmaya devam et
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ─── Ring with count ─── */
function RingCounter({ completed, total, active }: { completed: number; total: number; active: boolean }) {
  const size = 180;
  const stroke = 6;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const gap = 10;
  const segLen = (circ - gap * total) / total;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF375F" />
            <stop offset="100%" stopColor="#BF5AF2" />
          </linearGradient>
        </defs>
        {Array.from({ length: total }).map((_, i) => {
          const offset = i * (segLen + gap) - circ / 4;
          const done = i < completed;
          const activeSeg = i === completed && active;
          return (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={done ? "url(#rg)" : activeSeg ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${segLen} ${circ - segLen}`}
              strokeDashoffset={-offset}
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            />
          );
        })}
        {active && (
          <motion.circle
            cx={cx} cy={cy} r={r - stroke - 6}
            fill="none"
            stroke="rgba(255,55,95,0.12)"
            strokeWidth={stroke * 2}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white" style={{ fontSize: 42, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {completed}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          / {total}
        </span>
      </div>
    </div>
  );
}

/* ─── Scene dot ─── */
function SceneDot({ index, status }: { index: number; status: string }) {
  const done = status === "done";
  const active = status === "generating-image" || status === "generating-video";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
      {active && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 32, height: 32, background: "rgba(255,55,95,0.25)" }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <motion.div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          background: done
            ? "linear-gradient(135deg, #FF375F, #BF5AF2)"
            : active
            ? "rgba(255,255,255,0.2)"
            : "rgba(255,255,255,0.06)",
          border: `1.5px solid ${done ? "transparent" : active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}
        animate={{ scale: done ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 0.4 }}
      >
        {done ? (
          <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: active ? "white" : "rgba(255,255,255,0.3)" }}>
            {index + 1}
          </span>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Error state ─── */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 gap-6 text-center">
      <div
        className="rounded-full flex items-center justify-center"
        style={{ width: 64, height: 64, background: "rgba(255,69,58,0.15)" }}
      >
        <svg width="28" height="28" fill="none" stroke="#FF453A" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Bir sorun çıktı</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>Tekrar deneyebiliriz.</p>
      </div>
      <Button size="lg" onClick={onRetry}>Yeniden Dene</Button>
    </div>
  );
}
