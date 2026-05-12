"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { ProgressOrchestrator } from "@/components/generation/progress-orchestrator";
import { useGenerationStore, type SceneState } from "@/store/generation-store";
import { Button } from "@/components/ui/button";

/* ─── Progress calculation ─── */
function calcProgress(scenes: SceneState[], phase: string): number {
  // 4 scenes × 22.5% = 90% | finalize = 10%
  let p = 0;
  scenes.forEach((s) => {
    if (s.status === "done") p += 22.5;
    else if (s.status === "generating-video") p += 11;
    else if (s.status === "generating-image") p += 2;
  });
  if (phase === "finalizing") p = Math.max(p, 90);
  return Math.min(Math.round(p), 99);
}

function phaseLabel(phase: string, completed: number): string {
  if (phase === "finalizing") return "Birleştiriliyor";
  if (completed === 4) return "Tamamlandı";
  return "Üretim devam ediyor";
}

/* ─── Activity log ─── */
const SCENE_NAMES = ["Sahne 1", "Sahne 2", "Sahne 3", "Sahne 4"];
function buildLog(scenes: SceneState[], phase: string): string[] {
  const msgs: string[] = [];
  scenes.forEach((s, i) => {
    if (s.status === "generating-image") msgs.push(`${SCENE_NAMES[i]} — görsel işleniyor…`);
    else if (s.status === "generating-video") msgs.push(`${SCENE_NAMES[i]} — video oluşturuluyor…`);
    else if (s.status === "done") msgs.push(`${SCENE_NAMES[i]} — tamamlandı ✓`);
    else if (s.status === "error") msgs.push(`${SCENE_NAMES[i]} — hata`);
  });
  if (phase === "finalizing") msgs.push("Sahneler birleştiriliyor, müzik ekleniyor…");
  return msgs.length ? msgs : ["AI yüzleri analiz ediyor…"];
}

/* ═══════════════════════════════════════════
   Page
═══════════════════════════════════════════ */
export default function GeneratingPage() {
  const router = useRouter();
  const { scenes, phase, finalVideoUrl, overallError, jobId } = useGenerationStore();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);

  const completedScenes = scenes.filter((s) => s.status === "done").length;
  const isActive = phase === "generating" || phase === "finalizing";
  const progress = calcProgress(scenes, phase);

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
            "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255,55,95,0.18) 0%, transparent 65%)",
            "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(191,90,242,0.18) 0%, transparent 65%)",
            "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255,55,95,0.18) 0%, transparent 65%)",
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {isActive && <ProgressOrchestrator />}

      {/* Tab warning */}
      <AnimatePresence>
        {tabWarning && (
          <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-5 py-3"
            style={{ background: "rgba(255,159,10,0.18)", borderBottom: "1px solid rgba(255,159,10,0.28)" }}>
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
        <div className="relative z-10 flex flex-col items-center flex-1 px-5 safe-top pt-6 gap-5">

          {/* Phase badge */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PhaseBadge phase={phase} completedScenes={completedScenes} />
          </motion.div>

          {/* Progress orb */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}>
            <ProgressOrb progress={progress} isActive={isActive} />
          </motion.div>

          {/* Scene cards 2×2 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
            {scenes.map((s, i) => (
              <SceneCard key={i} index={i} scene={s} />
            ))}
          </motion.div>

          {/* Activity feed */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="w-full max-w-[320px]">
            <ActivityFeed scenes={scenes} phase={phase} />
          </motion.div>

          {/* Bottom: time + wake lock */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="flex items-center gap-4 safe-bottom pb-4">
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>Ortalama 3–5 dakika</span>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: wakeLockActive ? "#30D158" : "rgba(255,255,255,0.2)" }}
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

/* ─── Phase Badge ─── */
function PhaseBadge({ phase, completedScenes }: { phase: string; completedScenes: number }) {
  const label = phaseLabel(phase, completedScenes);
  const color = phase === "finalizing" ? "#FF9F0A" : "#FF375F";

  return (
    <AnimatePresence mode="wait">
      <motion.div key={label}
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full"
        style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <span className="text-[12px] font-semibold tracking-wide" style={{ color, letterSpacing: "0.04em" }}>
          {label.toUpperCase()}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Progress Orb ─── */
function ProgressOrb({ progress, isActive }: { progress: number; isActive: boolean }) {
  const size = 188;
  const stroke = 7;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const displayPct = useTransform(spring, Math.round);

  useEffect(() => { spring.set(progress); }, [progress, spring]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      {isActive && (
        <motion.div className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 48px rgba(255,55,95,0.25)", borderRadius: "50%" }}
        />
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF375F" />
            <stop offset="100%" stopColor="#BF5AF2" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#prog-grad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-bold text-white"
          style={{ fontSize: 46, lineHeight: 1, letterSpacing: "-0.04em" }}
        >
          {displayPct}
        </motion.span>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>%</span>
      </div>

      {/* Rotating inner ring when active */}
      {isActive && (
        <motion.div
          className="absolute"
          style={{
            inset: 18,
            borderRadius: "50%",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

/* ─── Scene Card ─── */
function SceneCard({ index, scene }: { index: number; scene: SceneState }) {
  const { status } = scene;
  const done = status === "done";
  const genImage = status === "generating-image";
  const genVideo = status === "generating-video";
  const active = genImage || genVideo;

  const accentColor = ["#FF375F", "#FF9F0A", "#BF5AF2", "#30D158"][index];

  return (
    <motion.div
      className="relative rounded-[16px] overflow-hidden flex flex-col items-center justify-center"
      style={{
        height: 110,
        background: done
          ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)`
          : active
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${done ? `${accentColor}40` : active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
      }}
      animate={{ scale: done ? [1, 1.03, 1] : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Scan line — image generation */}
      {genImage && (
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Audio bars — video generation */}
      {genVideo && (
        <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
          {[0.6, 1, 0.75, 1.2, 0.5, 0.9, 0.65].map((h, i) => (
            <motion.div key={i} className="w-1 rounded-full flex-shrink-0"
              style={{ background: accentColor, opacity: 0.7 }}
              animate={{ scaleY: [h, h * 1.8, h] }}
              transition={{ duration: 0.5 + i * 0.07, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {/* Done overlay */}
      {done && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${accentColor}30` }}>
            <svg width="18" height="18" fill="none" stroke={accentColor} strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Idle / label */}
      {!done && !active && (
        <span className="text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>
          {index + 1}
        </span>
      )}

      {/* Active label */}
      {active && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: `${accentColor}99`, letterSpacing: "0.1em" }}>
            {genImage ? "Görsel" : "Video"}
          </span>
        </motion.div>
      )}

      {/* Corner index */}
      <div className="absolute top-2 left-3">
        <span className="text-[11px] font-semibold" style={{ color: done ? `${accentColor}cc` : "rgba(255,255,255,0.2)" }}>
          {index + 1}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Activity Feed ─── */
function ActivityFeed({ scenes, phase }: { scenes: SceneState[]; phase: string }) {
  const [log, setLog] = useState<string[]>(["Yüzler analiz ediliyor…"]);
  const prevRef = useRef<string[]>([]);

  useEffect(() => {
    const current = buildLog(scenes, phase);
    const newLines = current.filter((m) => !prevRef.current.includes(m));
    if (newLines.length > 0) {
      setLog((prev) => [...prev, ...newLines].slice(-6));
      prevRef.current = current;
    }
  }, [scenes, phase]);

  return (
    <div className="rounded-[16px] px-4 py-3 flex flex-col gap-1.5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", minHeight: 72 }}>
      <AnimatePresence initial={false}>
        {log.slice(-4).map((msg, i, arr) => {
          const isLatest = i === arr.length - 1;
          return (
            <motion.div key={msg}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isLatest ? 1 : 0.35, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2">
              {isLatest && (
                <motion.div className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: msg.includes("✓") ? "#30D158" : "#FF375F" }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }} />
              )}
              {!isLatest && <div className="w-1 h-1 rounded-full flex-shrink-0 opacity-0" />}
              <span className="text-[12px]"
                style={{ color: isLatest ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                {msg}
              </span>
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
      <div className="rounded-full flex items-center justify-center"
        style={{ width: 64, height: 64, background: "rgba(255,69,58,0.15)" }}>
        <svg width="28" height="28" fill="none" stroke="#FF453A" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Bir sorun çıktı</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8, maxWidth: 260 }}>{error}</p>
      </div>
      <Button size="lg" onClick={onRetry}>Yeniden Dene</Button>
    </div>
  );
}
