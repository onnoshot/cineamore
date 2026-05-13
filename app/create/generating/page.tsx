"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore, type SceneState } from "@/store/generation-store";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n/use-lang";
import type { Translations } from "@/lib/i18n";

/* ─── Progress calculation ─── */
function calcProgress(scenes: SceneState[], phase: string): number {
  let p = 0;
  scenes.forEach((s) => {
    if (s.status === "done") p += 22.5;
    else if (s.status === "generating-video") p += 11;
    else if (s.status === "generating-image") p += 2;
  });
  if (phase === "finalizing") p = Math.max(p, 90);
  return Math.min(Math.round(p), 99);
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `~${s}sn kaldı`;
  return `~${m}:${s.toString().padStart(2, "0")} kaldı`;
}

/* ═══════════════════════════════════════════
   Page
═══════════════════════════════════════════ */
export default function GeneratingPage() {
  const router = useRouter();
  const { t } = useLang();
  const {
    scenes, phase, finalVideoUrl, overallError, jobId,
    updateScene, setFinalVideoUrl, setOverallError, setPhase,
  } = useGenerationStore();

  function phaseLabel(ph: string, completed: number): string {
    if (ph === "finalizing") return t.generating.finalizing;
    if (completed === 4) return t.generating.completed;
    return t.generating.inProgress;
  }

  function buildLog(sc: SceneState[], ph: string): string[] {
    const msgs: string[] = [];
    sc.forEach((s, i) => {
      const name = t.generating.sceneNames[i];
      if (s.status === "generating-image") msgs.push(`${name} — ${t.generating.imageProcessing}`);
      else if (s.status === "generating-video") msgs.push(`${name} — ${t.generating.videoCreating}`);
      else if (s.status === "done") msgs.push(`${name} — ${t.generating.sceneDone}`);
      else if (s.status === "error") msgs.push(`${name} — ${t.generating.sceneError}`);
    });
    if (ph === "finalizing") msgs.push(t.generating.merging);
    return msgs.length ? msgs : [t.generating.analyzing];
  }

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Poll job status from server every 4 seconds
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollJobStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/job-status/${jobId}`);
      if (!res.ok) return;
      const job = await res.json() as {
        status: string;
        scenes: SceneState[];
        final_video_url?: string;
        error?: string;
      };

      // Sync scenes from server
      job.scenes?.forEach((s: SceneState, i: number) => updateScene(i, s));

      if (job.status === "done" && job.final_video_url) {
        setFinalVideoUrl(job.final_video_url);
        // navigate handled by existing effect below
      } else if (job.status === "error" && job.error) {
        setOverallError(job.error);
      } else if (job.status === "finalizing") {
        setPhase("finalizing");
      } else if (
        job.status === "generating_images" ||
        job.status === "generating_videos" ||
        job.status === "pending"
      ) {
        setPhase("generating");
      }
    } catch { /* network glitch — retry next tick */ }
  }, [jobId, updateScene, setFinalVideoUrl, setOverallError, setPhase]);

  useEffect(() => {
    if (!jobId || phase === "idle") return;
    pollJobStatus(); // immediate first poll
    pollRef.current = setInterval(pollJobStatus, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, phase, pollJobStatus]);

  // Stop polling when done or error
  useEffect(() => {
    if (phase === "done" || overallError) {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [phase, overallError]);

  const completedScenes = scenes.filter((s) => s.status === "done").length;
  const isActive = phase === "generating" || phase === "finalizing";
  const progress = calcProgress(scenes, phase);

  useEffect(() => {
    const anyStarted = scenes.some((s) => s.status !== "idle");
    if (anyStarted && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, [scenes]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const estimatedRemaining = useMemo(() => {
    if (progress < 5 || elapsed < 10) return null;
    const totalEstimate = Math.round(elapsed / (progress / 100));
    const remaining = totalEstimate - elapsed;
    return remaining > 10 ? remaining : null;
  }, [progress, elapsed]);

  /* Wake Lock */
  useEffect(() => {
    if (!isActive) return;
    const request = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          setWakeLockActive(true);
          wakeLockRef.current.addEventListener("release", () => setWakeLockActive(false));
        } catch { /* not critical */ }
      }
    };
    request();
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
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(191,90,242,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tab warning */}
      <AnimatePresence>
        {tabWarning && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-5 py-3"
            style={{
              background: "rgba(255,159,10,0.18)",
              borderBottom: "1px solid rgba(255,159,10,0.28)",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="#FF9F0A" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: "#FF9F0A" }}>
              {t.generating.keepOpen}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {overallError ? (
        <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
      ) : (
        <div className="relative z-10 flex flex-col items-center flex-1 px-5 safe-top pt-6 pb-6 gap-4 w-full max-w-sm mx-auto">

          {/* Progress header */}
          <ProgressHeader
            progress={progress}
            estimatedRemaining={estimatedRemaining}
            phase={phase}
            label={phaseLabel(phase, completedScenes)}
          />

          {/* 4 scene rows */}
          <div className="w-full flex flex-col gap-2">
            {scenes.map((s, i) => (
              <SceneRow key={i} index={i} scene={s} t={t} />
            ))}
          </div>

          {/* Activity log */}
          <ActivityFeed scenes={scenes} phase={phase} buildLog={buildLog} />

          {/* Email + wake lock notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-2 safe-bottom pb-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.18)" }}>
              <svg width="12" height="12" fill="none" stroke="#0A84FF" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span style={{ fontSize: 11, color: "#0A84FF", fontWeight: 600 }}>
                Tamamlanınca e-posta gönderilecek
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: wakeLockActive ? "#30D158" : "rgba(255,255,255,0.18)" }}
                animate={wakeLockActive ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                {wakeLockActive ? "Ekran açık kalıyor" : "Bu sayfayı açık tut"}
              </span>
            </div>
          </motion.div>

        </div>
      )}
    </div>
  );
}

/* ─── Progress Header ─── */
function ProgressHeader({
  progress,
  estimatedRemaining,
  phase,
  label,
}: {
  progress: number;
  estimatedRemaining: number | null;
  phase: string;
  label: string;
}) {
  const isFinalizing = phase === "finalizing";
  const accentColor = isFinalizing ? "#FF9F0A" : "#0A84FF";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
            animate={{ opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-black uppercase"
              style={{ color: accentColor, letterSpacing: "0.1em" }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            {estimatedRemaining !== null && (
              <motion.span
                key={Math.floor(estimatedRemaining / 15)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[12px]"
                style={{ color: "rgba(255,255,255,0.32)" }}
              >
                {formatRemaining(estimatedRemaining)}
              </motion.span>
            )}
          </AnimatePresence>
          <span
            className="font-black tabular-nums"
            style={{ fontSize: 30, letterSpacing: "-0.04em", lineHeight: 1, color: "rgba(255,255,255,0.95)" }}
          >
            {progress}
          </span>
          <span className="text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 3, background: "rgba(255,255,255,0.07)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isFinalizing
              ? "linear-gradient(90deg, #FF9F0A, #FF375F)"
              : "linear-gradient(90deg, #0A84FF, #BF5AF2)",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Scene Row ─── */
function SceneRow({ index, scene, t }: {
  index: number;
  scene: SceneState;
  t: Translations;
}) {
  const { status, error } = scene;

  const stateColor =
    status === "done" ? "#30D158" :
    status === "generating-video" ? "#BF5AF2" :
    status === "generating-image" ? "#0A84FF" :
    status === "error" ? "#FF453A" :
    "rgba(255,255,255,0.14)";

  const rowBg =
    status === "done" ? "rgba(48,209,88,0.05)" :
    status === "error" ? "rgba(255,69,58,0.05)" :
    (status === "generating-image" || status === "generating-video") ? "rgba(255,255,255,0.04)" :
    "rgba(255,255,255,0.02)";

  const borderColor =
    status === "done" ? "rgba(48,209,88,0.22)" :
    status === "error" ? "rgba(255,69,58,0.22)" :
    status === "generating-image" ? "rgba(10,132,255,0.2)" :
    status === "generating-video" ? "rgba(191,90,242,0.2)" :
    "rgba(255,255,255,0.05)";

  const statusLabel =
    status === "done" ? t.generating.sceneDone :
    status === "generating-video" ? t.generating.videoCreating :
    status === "generating-image" ? t.generating.imageProcessing :
    status === "error" ? t.generating.sceneError :
    t.generating.waiting;

  const isProcessing = status === "generating-image" || status === "generating-video";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="w-full rounded-[18px] px-4 py-3.5 flex items-center gap-3.5"
      style={{
        background: rowBg,
        border: `1px solid ${borderColor}`,
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Number / state badge */}
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: status === "idle" ? "rgba(255,255,255,0.04)" : `${stateColor}18`,
          border: `1.5px solid ${status === "idle" ? "rgba(255,255,255,0.08)" : stateColor + "45"}`,
        }}
        animate={
          isProcessing
            ? { boxShadow: [`0 0 0 0px ${stateColor}40`, `0 0 0 6px transparent`] }
            : {}
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      >
        {status === "done" ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <svg width="16" height="16" fill="none" stroke="#30D158" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        ) : status === "error" ? (
          <svg width="14" height="14" fill="none" stroke="#FF453A" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: 16,
              lineHeight: 1,
              color: status === "idle" ? "rgba(255,255,255,0.18)" : stateColor,
            }}
          >
            {index + 1}
          </span>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[14px] font-semibold"
            style={{ color: status === "idle" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.88)" }}
          >
            {t.generating.sceneNames[index]}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-bold uppercase"
              style={{ color: stateColor, letterSpacing: "0.07em" }}
            >
              {statusLabel}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* State indicator bar */}
        <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {status === "generating-image" && (
            <motion.div
              className="absolute top-0 h-full w-[40%] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${stateColor}, transparent)` }}
              animate={{ left: ["-40%", "140%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            />
          )}
          {status === "generating-video" && (
            <motion.div
              className="absolute top-0 h-full rounded-full"
              style={{ background: stateColor, opacity: 0.65 }}
              animate={{ width: ["15%", "75%", "15%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {status === "done" && (
            <motion.div
              className="h-full rounded-full"
              style={{ background: stateColor, opacity: 0.55 }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
          )}
          {status === "error" && (
            <div className="h-full w-full rounded-full" style={{ background: stateColor, opacity: 0.4 }} />
          )}
        </div>

        {status === "error" && error && (
          <p className="text-[11px] truncate" style={{ color: "rgba(255,69,58,0.6)" }}>
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Activity Feed ─── */
function ActivityFeed({
  scenes,
  phase,
  buildLog,
}: {
  scenes: SceneState[];
  phase: string;
  buildLog: (s: SceneState[], p: string) => string[];
}) {
  const [log, setLog] = useState<string[]>([]);
  const prevRef = useRef<string[]>([]);

  useEffect(() => {
    const current = buildLog(scenes, phase);
    const newLines = current.filter((m) => !prevRef.current.includes(m));
    if (newLines.length > 0) {
      setLog((prev) => [...prev, ...newLines].slice(-6));
      prevRef.current = current;
    }
  }, [scenes, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (log.length === 0) return null;

  return (
    <div
      className="w-full rounded-[16px] px-4 py-3 flex flex-col gap-1"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <AnimatePresence initial={false}>
        {log.slice(-4).map((msg, i, arr) => {
          const isLatest = i === arr.length - 1;
          return (
            <motion.div
              key={msg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isLatest ? 1 : 0.25, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span
                style={{
                  fontSize: 10,
                  color: isLatest ? "#0A84FF" : "rgba(255,255,255,0.14)",
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                {isLatest ? "▶" : "·"}
              </span>
              <span
                className="text-[12px] leading-snug flex-1"
                style={{
                  color: isLatest ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.18)",
                  fontFamily: "monospace",
                }}
              >
                {msg}
              </span>
              {isLatest && (
                <motion.span
                  style={{ fontSize: 12, color: "#0A84FF", fontFamily: "monospace", flexShrink: 0 }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity }}
                >
                  _
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─── Error State ─── */
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
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
          Bir sorun çıktı
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8, maxWidth: 260 }}>
          {error}
        </p>
      </div>
      <Button size="lg" onClick={onRetry}>Yeniden Dene</Button>
    </div>
  );
}
