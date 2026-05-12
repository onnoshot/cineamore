"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusText } from "@/components/generation/status-text";
import { ProgressOrchestrator } from "@/components/generation/progress-orchestrator";
import { useGenerationStore } from "@/store/generation-store";
import { Button } from "@/components/ui/button";
import { SCENES } from "@/lib/ai/prompts";

export default function GeneratingPage() {
  const router = useRouter();
  const { scenes, phase, finalVideoUrl, overallError, jobId } = useGenerationStore();

  const completedScenes = scenes.filter((s) => s.status === "done").length;
  const isActive = phase === "generating" || phase === "finalizing";

  useEffect(() => {
    if (phase === "done" && finalVideoUrl && jobId) router.replace(`/create/${jobId}`);
  }, [phase, finalVideoUrl, jobId, router]);

  useEffect(() => {
    if (phase === "idle") router.replace("/create");
  }, [phase, router]);

  const textPhase = phase === "finalizing" ? 5 : completedScenes;

  return (
    <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,55,95,0.12) 0%, transparent 70%)",
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(191,90,242,0.14) 0%, transparent 70%)",
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,55,95,0.12) 0%, transparent 70%)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingParticles />
      </div>

      {isActive && <ProgressOrchestrator />}

      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full px-6 items-center justify-center">
        {overallError ? (
          <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            >
              <ProgressRing
                segments={4}
                completed={completedScenes}
                active={isActive}
                size={220}
                strokeWidth={7}
                label="Sahne"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 w-full"
            >
              <StatusText phase={textPhase} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 w-full space-y-2"
            >
              {SCENES.map((scene, i) => (
                <SceneRow key={i} label={scene.label} status={scenes[i].status} index={i} />
              ))}
              {phase === "finalizing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SceneRow label="Müzik & Son Dokunuş" status="generating-image" index={4} />
                </motion.div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-xs text-white/25 text-center"
            >
              Ortalama 3–5 dakika · Telefonu açık tut
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  idle:               { dot: "bg-white/15",   text: "text-white/30",   label: "Bekliyor" },
  "generating-image": { dot: "bg-yellow-400", text: "text-yellow-400", label: "Görsel üretiliyor…" },
  "generating-video": { dot: "bg-violet-400", text: "text-violet-400", label: "Video üretiliyor…" },
  done:               { dot: "bg-green-400",  text: "text-green-400",  label: "Hazır" },
  error:              { dot: "bg-red-400",    text: "text-red-400",    label: "Hata — yeniden denenecek" },
} as const;

type SceneStatus = keyof typeof STATUS_CONFIG;

function SceneRow({ label, status, index }: { label: string; status: string; index: number }) {
  const cfg = STATUS_CONFIG[status as SceneStatus] ?? STATUS_CONFIG.idle;
  const isActive = status === "generating-image" || status === "generating-video";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass rounded-[12px] px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          {isActive && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
        </span>
        <span className="text-[14px] text-white/80 font-medium">{label}</span>
      </div>
      <span className={`text-[12px] ${cfg.text}`}>{cfg.label}</span>
    </motion.div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center px-4"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
        <svg width="28" height="28" fill="none" stroke="#FF453A" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white/90">Bir sorun çıktı</h2>
        <p className="text-sm text-white/50 mt-2">Merak etme, tekrar deneyebiliriz.</p>
        <p className="text-xs text-white/25 mt-1">{error}</p>
      </div>
      <Button size="lg" onClick={onRetry}>Yeniden Dene</Button>
    </motion.div>
  );
}

function FloatingParticles() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.3) % 100}%`,
    top: `${(i * 9.7) % 100}%`,
    size: (i % 3) + 1,
    delay: (i * 0.35) % 5,
    duration: (i % 4) + 4,
    color: i % 3 === 0 ? "rgba(255,55,95,0.5)" : i % 3 === 1 ? "rgba(191,90,242,0.5)" : "rgba(255,159,10,0.3)",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color }}
          animate={{ y: [-10, -40, -10], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
