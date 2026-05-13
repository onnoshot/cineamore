"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

/* ─── Types ─── */
type SceneStatus = "idle" | "generating-image" | "generating-video" | "done" | "error";
interface SceneState {
  imageUrl?: string;
  videoUrl?: string;
  status: SceneStatus;
  error?: string;
}

/* ─── Constants ─── */
const SCENE_INFO = [
  { name: "Kaçış",    sub: "Çöl koşusu" },
  { name: "Dokunuş", sub: "Dönüşüm anı" },
  { name: "Bakış",   sub: "Göz göze" },
  { name: "Yürüyüş", sub: "Birlikte" },
] as const;

const STAGE_META = {
  images:     { label: "SAHNELER TASARLANIYOR",  colors: ["#BF5AF2", "#0A84FF"] as [string, string] },
  videos:     { label: "SAHNELER CANLANDIRILIYOR", colors: ["#FF375F", "#BF5AF2"] as [string, string] },
  finalizing: { label: "FİLM BİRLEŞTİRİLİYOR",   colors: ["#FF9F0A", "#FF375F"] as [string, string] },
};

const DEFAULT_SCENES: SceneState[] = [
  { status: "idle" }, { status: "idle" }, { status: "idle" }, { status: "idle" },
];

/* ─── Helpers ─── */
function calcProgress(scenes: SceneState[], finalizing: boolean): number {
  let p = 0;
  scenes.forEach((s) => {
    if (s.status === "generating-image") p += 5;
    else if (s.status === "generating-video") p += 15;
    else if (s.status === "done") p += 22;
  });
  if (finalizing) p = Math.max(p, 90);
  return Math.min(Math.round(p), 99);
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

/* ══════════════════════════════════════════════════════
   INNER COMPONENT — reads URL params
══════════════════════════════════════════════════════ */
function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobId  = searchParams.get("jobId");
  const city   = searchParams.get("city") || null;
  const email  = searchParams.get("email") || null;

  const [scenes, setScenes] = useState<SceneState[]>(DEFAULT_SCENES.map(s => ({...s})));
  const [finalizing, setFinalizing] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const pipelineRef  = useRef(false);

  const updateScene = (i: number, update: Partial<SceneState>) =>
    setScenes(prev => {
      const next = [...prev] as SceneState[];
      next[i] = { ...next[i], ...update };
      return next;
    });

  /* ── Redirect if no jobId ── */
  useEffect(() => {
    if (!jobId) router.replace("/create");
  }, [jobId, router]);

  /* ── Pipeline ── */
  useEffect(() => {
    if (!jobId || pipelineRef.current) return;
    pipelineRef.current = true;
    startTimeRef.current = Date.now();

    const origin  = window.location.origin;
    const manUrl  = `${origin}/api/img/${jobId}/man`;
    const womanUrl = `${origin}/api/img/${jobId}/woman`;

    (async () => {
      try {
        /* -- helper: poll until Higgsfield job finishes -- */
        async function waitForJob(higgsfieldJobId: string, label: string): Promise<string> {
          for (let attempt = 0; attempt < 120; attempt++) {
            await new Promise((r) => setTimeout(r, attempt < 6 ? 5000 : 8000));
            const pr = await fetch("/api/poll-job", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ higgsfieldJobId }),
            });
            const pd = await pr.json() as { done?: boolean; failed?: boolean; url?: string; error?: string };
            if (!pr.ok) throw new Error(pd.error ?? `${label} poll ${pr.status}`);
            if (pd.failed) throw new Error(`${label} başarısız`);
            if (pd.done && pd.url) return pd.url;
          }
          throw new Error(`${label} zaman aşımı`);
        }

        /* STEP 1 — submit all 4 image jobs */
        updateScene(0, { status: "generating-image" });
        updateScene(1, { status: "generating-image" });
        updateScene(2, { status: "generating-image" });
        updateScene(3, { status: "generating-image" });

        const imageResults = await Promise.all(
          [0, 1, 2, 3].map(async (i) => {
            const res = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sceneIndex: i, manUrl, womanUrl, city }),
            });
            const data = await res.json() as { imageUrl?: string; higgsfieldJobId?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? `Sahne ${i + 1} görsel hatası`);

            const imageUrl = data.imageUrl ?? await waitForJob(data.higgsfieldJobId!, `Sahne ${i + 1} görsel`);
            updateScene(i, { status: "generating-video", imageUrl });
            return imageUrl;
          })
        );

        /* STEP 2 — submit all 4 video jobs */
        const videoUrls: string[] = new Array(4);
        await Promise.all(
          imageResults.map(async (imageUrl, i) => {
            const res = await fetch("/api/generate-video", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sceneIndex: i, imageUrl, city }),
            });
            const data = await res.json() as { videoUrl?: string; higgsfieldJobId?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? `Sahne ${i + 1} video hatası`);

            const videoUrl = data.videoUrl ?? await waitForJob(data.higgsfieldJobId!, `Sahne ${i + 1} video`);
            videoUrls[i] = videoUrl;
            updateScene(i, { status: "done", videoUrl });
          })
        );

        /* STEP 3 — finalize */
        setFinalizing(true);
        const res = await fetch("/api/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, videoUrls, email }),
        });
        const data = await res.json() as { finalVideoUrl?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Birleştirme hatası");

        router.replace(`/create/${jobId}`);
      } catch (err: unknown) {
        setOverallError(err instanceof Error ? err.message : "Bir hata oluştu");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  /* ── Timer ── */
  useEffect(() => {
    const id = setInterval(() => {
      if (startTimeRef.current)
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const progress = calcProgress(scenes, finalizing);
  const stage: "images" | "videos" | "finalizing" = finalizing ? "finalizing"
    : scenes.some((s) => s.status === "generating-video" || s.status === "done") ? "videos"
    : "images";
  const meta = STAGE_META[stage];

  const remainingSec = useMemo(() => {
    if (progress < 8 || elapsed < 20) return null;
    const r = Math.round((elapsed * (100 - progress)) / Math.max(progress, 1));
    return r > 5 ? r : null;
  }, [progress, elapsed]);

  if (overallError) {
    return (
      <div className="page">
        <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
      </div>
    );
  }

  return (
    <div className="page" style={{ background: "#000", overflow: "hidden" }}>
      <AmbientBackground stage={stage} />

      <div className="relative z-10 flex flex-col items-center flex-1 px-5 safe-top pt-6 pb-8 w-full max-w-sm mx-auto overflow-y-auto">

        {/* Status label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-6"
        >
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.colors[0] }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.8, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }} />
          <AnimatePresence mode="wait">
            <motion.span key={stage}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] font-black tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.28)" }}>
              {meta.label}
            </motion.span>
          </AnimatePresence>
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.colors[0] }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.8, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }} />
        </motion.div>

        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center mb-2"
        >
          <ProgressRing progress={progress} colors={meta.colors} />
          <h1 className="font-black text-white/90 text-center mt-4"
            style={{ fontSize: 22, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            Hikayeniz Hazırlanıyor
          </h1>
          <p className="text-[12px] mt-1 text-center" style={{ color: "rgba(255,255,255,0.28)" }}>
            4 sinematik sahne oluşturuluyor
          </p>
        </motion.div>

        {/* Time row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-between w-full px-1 mb-4">
          <span className="text-[12px] tabular-nums" style={{ color: "rgba(255,255,255,0.22)" }}>
            {elapsed > 0 ? `${fmt(elapsed)} geçti` : "başlıyor…"}
          </span>
          {remainingSec != null && (
            <span className="text-[12px] tabular-nums" style={{ color: "rgba(255,255,255,0.22)" }}>
              ~{fmt(remainingSec)} kaldı
            </span>
          )}
        </motion.div>

        {/* Stage pills */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-2 w-full mb-5">
          {(["images", "videos", "finalizing"] as const).map((s, i) => {
            const isActive = stage === s;
            const isPast = (s === "images" && (stage === "videos" || stage === "finalizing"))
              || (s === "videos" && stage === "finalizing");
            const LABELS = { images: "Görseller", videos: "Videolar", finalizing: "Birleştirme" };
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <motion.div
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[10px] font-bold"
                  animate={{
                    background: isPast ? "rgba(48,209,88,0.12)" : isActive ? `${meta.colors[0]}1A` : "rgba(255,255,255,0.04)",
                    borderColor: isPast ? "rgba(48,209,88,0.28)" : isActive ? `${meta.colors[0]}40` : "rgba(255,255,255,0.07)",
                    color: isPast ? "#30D158" : isActive ? meta.colors[0] : "rgba(255,255,255,0.2)",
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ border: "1px solid" }}
                >
                  {isPast && (
                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {LABELS[s]}
                </motion.div>
                {i < 2 && (
                  <svg width="9" height="9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Scene cards */}
        <div className="w-full flex flex-col gap-2.5">
          {scenes.map((s, i) => (
            <SceneCard key={i} index={i} scene={s} stageColors={meta.colors} />
          ))}
        </div>

        {/* Email notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="w-full mt-auto pt-5 safe-bottom">
          <div className="rounded-[18px] px-4 py-3.5 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(10,132,255,0.1)" }}>
              <svg width="14" height="14" fill="none" stroke="#0A84FF" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Sekmeyi açık tutun</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Bitince e-postanıza göndereceğiz</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE EXPORT — Suspense boundary for useSearchParams
══════════════════════════════════════════════════════ */
export default function GeneratingPage() {
  return (
    <Suspense fallback={<div className="page" style={{ background: "#000" }} />}>
      <GeneratingContent />
    </Suspense>
  );
}

/* ──────────────────────────────────────────
   Ambient blobs
────────────────────────────────────────── */
function AmbientBackground({ stage }: { stage: string }) {
  const configs = {
    images:     [
      { color: "rgba(191,90,242,0.13)", x: "-20%", y: "-10%", size: "70%", dur: 18 },
      { color: "rgba(10,132,255,0.09)", x: "50%",  y: "40%",  size: "55%", dur: 22 },
      { color: "rgba(255,55,95,0.06)",  x: "10%",  y: "65%",  size: "45%", dur: 26 },
    ],
    videos:     [
      { color: "rgba(255,55,95,0.12)",  x: "30%",  y: "-15%", size: "65%", dur: 16 },
      { color: "rgba(191,90,242,0.10)", x: "-15%", y: "50%",  size: "60%", dur: 20 },
      { color: "rgba(10,132,255,0.07)", x: "55%",  y: "55%",  size: "50%", dur: 24 },
    ],
    finalizing: [
      { color: "rgba(255,159,10,0.12)", x: "20%",  y: "-20%", size: "70%", dur: 14 },
      { color: "rgba(255,55,95,0.10)",  x: "-10%", y: "45%",  size: "55%", dur: 18 },
      { color: "rgba(191,90,242,0.07)", x: "60%",  y: "60%",  size: "45%", dur: 22 },
    ],
  };
  const blobs = configs[stage as keyof typeof configs] ?? configs.images;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div key={`${stage}-${i}`} className="absolute rounded-full"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`, filter: "blur(40px)" }}
          animate={{ x: [0, 24, -16, 0], y: [0, -20, 12, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: i * 3 }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   Progress ring
────────────────────────────────────────── */
function ProgressRing({ progress, colors }: { progress: number; colors: [string, string] }) {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ inset: 16, background: `radial-gradient(circle, ${colors[0]}22, transparent 70%)`, filter: "blur(18px)" }}
        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />

      <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="pgr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <motion.circle cx="85" cy="85" r={r} fill="none"
          stroke="url(#pgr)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }} />
        {progress > 3 && (
          <circle
            cx={85 + r * Math.cos((-90 + 360 * progress / 100) * Math.PI / 180)}
            cy={85 + r * Math.sin((-90 + 360 * progress / 100) * Math.PI / 180)}
            r="4" fill={colors[1]} />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-end">
          <AnimatePresence mode="wait">
            <motion.span key={progress}
              initial={{ opacity: 0, scale: 0.75, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="tabular-nums font-black"
              style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.05em", color: "rgba(255,255,255,0.95)" }}>
              {progress}
            </motion.span>
          </AnimatePresence>
          <span className="font-bold mb-1.5 ml-0.5" style={{ fontSize: 18, color: "rgba(255,255,255,0.25)" }}>%</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Scene card
────────────────────────────────────────── */
function SceneCard({ index, scene, stageColors }: {
  index: number; scene: SceneState; stageColors: [string, string];
}) {
  const { status, error } = scene;
  const info = SCENE_INFO[index];
  const isProcessing = status === "generating-image" || status === "generating-video";
  const stateColor =
    status === "done"             ? "#30D158" :
    status === "generating-video" ? "#BF5AF2" :
    status === "generating-image" ? "#0A84FF" :
    status === "error"            ? "#FF453A" : "rgba(255,255,255,0.14)";
  const statusLabel =
    status === "done"             ? "Hazır ✓" :
    status === "generating-video" ? "Video oluşturuluyor" :
    status === "generating-image" ? "Görsel oluşturuluyor" :
    status === "error"            ? (error ?? "Hata") : "Sırada";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{
        background: status === "done" ? "rgba(48,209,88,0.05)" : status === "error" ? "rgba(255,69,58,0.05)" : isProcessing ? `${stateColor}0A` : "rgba(255,255,255,0.03)",
        border: `1px solid ${status === "done" ? "rgba(48,209,88,0.2)" : status === "error" ? "rgba(255,69,58,0.2)" : isProcessing ? `${stateColor}35` : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(16px)",
        borderRadius: 18,
        padding: "14px 16px",
        overflow: "hidden",
        position: "relative",
        transition: "background 0.6s ease, border-color 0.6s ease",
      }}
    >
      {isProcessing && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(105deg, transparent 30%, ${stateColor}08 50%, transparent 70%)` }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }} />
      )}
      <div className="relative flex items-center gap-3">
        <motion.div
          style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${stateColor}14`, border: `1.5px solid ${stateColor}38` }}
          animate={isProcessing ? { boxShadow: [`0 0 0 0px ${stateColor}30`, `0 0 0 7px transparent`] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        >
          {status === "done" ? (
            <motion.svg width="14" height="14" fill="none" stroke="#30D158" strokeWidth="2.5" viewBox="0 0 24 24"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 14 }}>
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          ) : status === "error" ? (
            <svg width="12" height="12" fill="none" stroke="#FF453A" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="font-black tabular-nums"
              style={{ fontSize: 15, lineHeight: 1, color: status === "idle" ? "rgba(255,255,255,0.2)" : stateColor }}>
              {index + 1}
            </span>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold"
              style={{ fontSize: 14, color: status === "idle" ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.9)" }}>
              {info.name}
            </span>
            <AnimatePresence mode="wait">
              <motion.span key={status}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-semibold flex-shrink-0"
                style={{ fontSize: 11, color: stateColor }}>
                {statusLabel}
              </motion.span>
            </AnimatePresence>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{info.sub}</p>
          <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 9, overflow: "hidden", position: "relative" }}>
            {status === "generating-image" && (
              <motion.div style={{ position: "absolute", top: 0, height: "100%", width: "40%", borderRadius: 2, background: `linear-gradient(90deg, transparent, ${stateColor}, transparent)` }}
                animate={{ x: ["-40%", "340%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} />
            )}
            {status === "generating-video" && (
              <motion.div style={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2, background: stateColor, opacity: 0.65 }}
                animate={{ width: ["15%", "75%", "15%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
            )}
            {status === "done" && (
              <motion.div style={{ height: "100%", borderRadius: 2, background: stateColor, opacity: 0.55 }}
                initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }} />
            )}
            {status === "error" && (
              <div style={{ height: "100%", width: "100%", borderRadius: 2, background: stateColor, opacity: 0.4 }} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────
   Error state
────────────────────────────────────────── */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 gap-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-full flex items-center justify-center"
        style={{ width: 64, height: 64, background: "rgba(255,69,58,0.12)", border: "1px solid rgba(255,69,58,0.25)" }}>
        <svg width="26" height="26" fill="none" stroke="#FF453A" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
        </svg>
      </motion.div>
      <div>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Bir sorun çıktı</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8, maxWidth: 260 }}>{error}</p>
      </div>
      <Button size="lg" onClick={onRetry}>Yeniden Dene</Button>
    </div>
  );
}
