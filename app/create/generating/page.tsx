"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore, type SceneState } from "@/store/generation-store";
import { Button } from "@/components/ui/button";

/* ─── Constants ─── */
const SCENE_INFO = [
  { name: "Kaçış",    sub: "Çöl koşusu" },
  { name: "Dokunuş", sub: "Dönüşüm anı" },
  { name: "Bakış",   sub: "Göz göze" },
  { name: "Yürüyüş", sub: "Birlikte" },
] as const;

/* ─── Helpers ─── */
function calcProgress(scenes: SceneState[], phase: string): number {
  let p = 0;
  scenes.forEach((s) => {
    if (s.status === "generating-image") p += 5;
    else if (s.status === "generating-video") p += 15;
    else if (s.status === "done") p += 22;
  });
  if (phase === "finalizing") p = Math.max(p, 90);
  return Math.min(Math.round(p), 99);
}

function getStage(scenes: SceneState[], phase: string): "images" | "videos" | "finalizing" {
  if (phase === "finalizing") return "finalizing";
  const inVideo = scenes.some(
    (s) => s.status === "generating-video" || s.status === "done"
  );
  return inVideo ? "videos" : "images";
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}sn`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════
   Page
═══════════════════════════════════════════ */
export default function GeneratingPage() {
  const router = useRouter();
  const {
    scenes, phase, finalVideoUrl, overallError, jobId,
    manRef, womanRef, city, email,
    updateScene, setFinalVideoUrl, setOverallError, setPhase,
  } = useGenerationStore();

  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pipelineRef = useRef(false);
  const [preparingChars, setPreparingChars] = useState(false);

  /* ── Client-side pipeline ── */
  useEffect(() => {
    if (!jobId || !manRef || !womanRef) return;
    if (phase !== "generating") return;
    if (pipelineRef.current) return;
    if (scenes.some((s) => s.status !== "idle")) return;
    pipelineRef.current = true;

    (async () => {
      try {
        // Step 0: Generate soul_2 character portraits for face identity (parallel)
        setPreparingChars(true);
        const [manPortraitJobId, womanPortraitJobId] = await Promise.all([
          fetch("/api/generate-character", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl: manRef }),
          }).then((r) => r.json()).then((d) => {
            if (!d.portraitJobId) throw new Error(d.error ?? "Erkek portresi hatası");
            return d.portraitJobId as string;
          }),
          fetch("/api/generate-character", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl: womanRef }),
          }).then((r) => r.json()).then((d) => {
            if (!d.portraitJobId) throw new Error(d.error ?? "Kadın portresi hatası");
            return d.portraitJobId as string;
          }),
        ]);
        setPreparingChars(false);

        // Step 1: 4 scene images in parallel (using portrait job IDs as face references)
        const imageUrls: string[] = new Array(4);
        await Promise.all(
          [0, 1, 2, 3].map(async (i) => {
            updateScene(i, { status: "generating-image" });
            const res = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId, sceneIndex: i, manUrl: manPortraitJobId, womanUrl: womanPortraitJobId, city }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? `Sahne ${i + 1} görsel hatası`);
            imageUrls[i] = data.imageUrl;
            updateScene(i, { status: "generating-video", imageUrl: data.imageUrl });
          })
        );

        // Step 2: 4 videos in parallel
        const videoUrls: string[] = new Array(4);
        await Promise.all(
          imageUrls.map(async (imageUrl, i) => {
            const res = await fetch("/api/generate-video", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId, sceneIndex: i, imageUrl, city }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? `Sahne ${i + 1} video hatası`);
            videoUrls[i] = data.videoUrl;
            updateScene(i, { status: "done", videoUrl: data.videoUrl });
          })
        );

        // Step 3: Finalize (FFmpeg + music + email)
        setPhase("finalizing");
        const res = await fetch("/api/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, videoUrls, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Birleştirme hatası");

        setFinalVideoUrl(data.finalVideoUrl);
      } catch (err: unknown) {
        setOverallError(err instanceof Error ? err.message : "Bir hata oluştu");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, manRef, womanRef, phase]);

  /* ── Timer ── */
  const isActive = phase === "generating" || phase === "finalizing";

  useEffect(() => {
    if (scenes.some((s) => s.status !== "idle") && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, [scenes]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      if (startTimeRef.current)
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  /* ── Derived ── */
  const progress = calcProgress(scenes, phase);
  const stage = getStage(scenes, phase);

  const remainingSec = useMemo(() => {
    if (progress < 8 || elapsed < 15) return null;
    const rem = Math.round((elapsed * (100 - progress)) / Math.max(progress, 1));
    return rem > 5 ? rem : null;
  }, [progress, elapsed]);

  /* ── Navigation ── */
  useEffect(() => {
    if (phase === "done" && finalVideoUrl && jobId)
      router.replace(`/create/${jobId}`);
  }, [phase, finalVideoUrl, jobId, router]);

  useEffect(() => {
    if (phase === "idle") router.replace("/create");
  }, [phase, router]);

  /* ── Error ── */
  if (overallError) {
    return (
      <div className="page">
        <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
      </div>
    );
  }

  /* ── Stage labels ── */
  const STAGE_LABELS = { images: "Sahneler Tasarlanıyor", videos: "Sahneler Canlandırılıyor", finalizing: "Film Birleştiriliyor" };
  const STAGE_PILLS = [
    { key: "images",     label: "Görseller" },
    { key: "videos",     label: "Videolar" },
    { key: "finalizing", label: "Birleştirme" },
  ] as const;

  const accentGradient = stage === "finalizing"
    ? "linear-gradient(90deg, #FF375F, #FF9F0A)"
    : "linear-gradient(90deg, #BF5AF2, #0A84FF)";

  return (
    <div className="page">

      {/* Ambient bg */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 130% 50% at 50% 0%, rgba(191,90,242,0.10) 0%, transparent 65%)",
            "radial-gradient(ellipse 130% 50% at 50% 0%, rgba(10,132,255,0.09) 0%, transparent 65%)",
            "radial-gradient(ellipse 130% 50% at 50% 0%, rgba(255,55,95,0.08) 0%, transparent 65%)",
            "radial-gradient(ellipse 130% 50% at 50% 0%, rgba(191,90,242,0.10) 0%, transparent 65%)",
          ],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center flex-1 px-5 safe-top pt-7 pb-6 gap-5 w-full max-w-sm mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full text-center"
        >
          {/* Status pill */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#BF5AF2" }}
              animate={{ opacity: [1, 0.25, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={stage}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] font-black uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.32)" }}
              >
                {STAGE_LABELS[stage]}
              </motion.span>
            </AnimatePresence>
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#BF5AF2" }}
              animate={{ opacity: [1, 0.25, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
            />
          </div>

          <h1
            className="font-black text-white/95"
            style={{ fontSize: 24, letterSpacing: "-0.025em", lineHeight: 1.1 }}
          >
            Hikayeniz Hazırlanıyor
          </h1>
          <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.32)" }}>
            4 sinematik sahne, sizin için oluşturuluyor
          </p>
        </motion.div>

        {/* ── Progress + time ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          {/* Time row */}
          <div className="flex items-baseline justify-between mb-2.5 px-0.5">
            <span
              className="text-[12px] tabular-nums w-16"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {elapsed > 0 ? `${formatTime(elapsed)} geçti` : "başlıyor…"}
            </span>

            <div className="flex items-baseline gap-0.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={progress}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="tabular-nums font-black"
                  style={{ fontSize: 38, letterSpacing: "-0.04em", lineHeight: 1, color: "rgba(255,255,255,0.95)" }}
                >
                  {progress}
                </motion.span>
              </AnimatePresence>
              <span className="font-bold text-[18px]" style={{ color: "rgba(255,255,255,0.28)" }}>%</span>
            </div>

            <div className="flex justify-end w-16">
              <AnimatePresence mode="wait">
                {remainingSec !== null ? (
                  <motion.span
                    key={Math.floor(remainingSec / 10)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] tabular-nums text-right"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    ~{formatTime(remainingSec)} kaldı
                  </motion.span>
                ) : (
                  <span className="text-[12px] text-right" style={{ color: "rgba(255,255,255,0.12)" }}>—</span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentGradient }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>

          {/* Stage pills */}
          <div className="flex items-center mt-3 gap-1.5">
            {STAGE_PILLS.map(({ key, label }, i) => {
              const isCurrentStage = stage === key;
              const isPastStage =
                (key === "images" && (stage === "videos" || stage === "finalizing")) ||
                (key === "videos" && stage === "finalizing");

              return (
                <div key={key} className="flex items-center gap-1.5 flex-1">
                  <div
                    className="flex-1 flex items-center justify-center gap-1 rounded-full py-1 text-[10px] font-bold"
                    style={{
                      background: isPastStage
                        ? "rgba(48,209,88,0.10)"
                        : isCurrentStage
                        ? "rgba(191,90,242,0.13)"
                        : "rgba(255,255,255,0.04)",
                      color: isPastStage ? "#30D158" : isCurrentStage ? "#BF5AF2" : "rgba(255,255,255,0.18)",
                      border: `1px solid ${isPastStage ? "rgba(48,209,88,0.22)" : isCurrentStage ? "rgba(191,90,242,0.28)" : "rgba(255,255,255,0.06)"}`,
                      transition: "all 0.5s ease",
                    }}
                  >
                    {isPastStage && (
                      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {label}
                  </div>
                  {i < 2 && (
                    <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Character prep indicator ── */}
        <AnimatePresence>
          {preparingChars && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="w-full rounded-[14px] px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(191,90,242,0.07)",
                border: "1px solid rgba(191,90,242,0.18)",
              }}
            >
              <motion.div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: "#BF5AF2" }}
                animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                Yüzler analiz ediliyor, karakterler hazırlanıyor…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scene cards ── */}
        <div className="w-full flex flex-col gap-2">
          {scenes.map((s, i) => (
            <SceneCard key={i} index={i} scene={s} />
          ))}
        </div>

        {/* ── Email notice ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="w-full mt-auto safe-bottom"
        >
          <div
            className="w-full rounded-[18px] px-4 py-4 flex items-start gap-3"
            style={{
              background: "rgba(10,132,255,0.06)",
              border: "1px solid rgba(10,132,255,0.14)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(10,132,255,0.12)" }}
            >
              <svg width="16" height="16" fill="none" stroke="#0A84FF" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.82)" }}>
                Bu sekmeyi açık tutun
              </p>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                İşlem tamamlanınca e-postanıza göndereceğiz. Sekmeyi kapatırsanız işlem durur.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

/* ─── Scene Card ─── */
function SceneCard({ index, scene }: { index: number; scene: SceneState }) {
  const { status, error } = scene;
  const info = SCENE_INFO[index];

  const stateColor =
    status === "done"             ? "#30D158" :
    status === "generating-video" ? "#BF5AF2" :
    status === "generating-image" ? "#0A84FF" :
    status === "error"            ? "#FF453A" :
                                    "rgba(255,255,255,0.14)";

  const statusLabel =
    status === "done"             ? "Hazır" :
    status === "generating-video" ? "Video oluşturuluyor" :
    status === "generating-image" ? "Görsel oluşturuluyor" :
    status === "error"            ? "Hata" :
                                    "Sırada";

  const isProcessing = status === "generating-image" || status === "generating-video";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="w-full rounded-[16px] px-4 py-3 flex items-center gap-3"
      style={{
        background:
          status === "done"  ? "rgba(48,209,88,0.04)"  :
          status === "error" ? "rgba(255,69,58,0.04)"   :
                               "rgba(255,255,255,0.025)",
        border: `1px solid ${
          status === "done"  ? "rgba(48,209,88,0.18)"  :
          status === "error" ? "rgba(255,69,58,0.18)"   :
          isProcessing       ? stateColor + "28"        :
                               "rgba(255,255,255,0.06)"
        }`,
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Badge */}
      <motion.div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: `${stateColor}14`,
          border: `1.5px solid ${stateColor}38`,
        }}
        animate={
          isProcessing
            ? { boxShadow: [`0 0 0 0px ${stateColor}38`, `0 0 0 6px transparent`] }
            : {}
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      >
        {status === "done" ? (
          <motion.svg
            width="15" height="15" fill="none" stroke="#30D158" strokeWidth="2.5" viewBox="0 0 24 24"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        ) : status === "error" ? (
          <svg width="13" height="13" fill="none" stroke="#FF453A" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: 14, lineHeight: 1,
              color: status === "idle" ? "rgba(255,255,255,0.18)" : stateColor,
            }}
          >
            {index + 1}
          </span>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[14px] font-semibold"
            style={{ color: status === "idle" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.88)" }}
          >
            {info.name}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-semibold flex-shrink-0"
              style={{ color: stateColor }}
            >
              {statusLabel}
            </motion.span>
          </AnimatePresence>
        </div>

        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
          {info.sub}
        </p>

        {/* Progress shimmer */}
        <div
          className="relative h-[2px] rounded-full overflow-hidden mt-2"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {status === "generating-image" && (
            <motion.div
              className="absolute top-0 h-full w-[35%] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${stateColor}, transparent)` }}
              animate={{ left: ["-35%", "135%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
            />
          )}
          {status === "generating-video" && (
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ background: stateColor, opacity: 0.7 }}
              animate={{ width: ["20%", "80%", "20%"] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {status === "done" && (
            <motion.div
              className="h-full rounded-full"
              style={{ background: stateColor, opacity: 0.5 }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            />
          )}
          {status === "error" && (
            <div className="h-full w-full rounded-full" style={{ background: stateColor, opacity: 0.4 }} />
          )}
        </div>

        {error && (
          <p className="text-[10px] truncate mt-1" style={{ color: "rgba(255,69,58,0.55)" }}>
            {error}
          </p>
        )}
      </div>
    </motion.div>
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
