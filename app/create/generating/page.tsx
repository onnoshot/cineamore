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

  // Redirect if already done
  useEffect(() => {
    if (phase === "done" && finalVideoUrl && jobId) {
      router.replace(`/create/${jobId}`);
    }
  }, [phase, finalVideoUrl, jobId, router]);

  // Redirect if no job
  useEffect(() => {
    if (phase === "idle") {
      router.replace("/create");
    }
  }, [phase, router]);

  const textPhase = phase === "finalizing" ? 5 : completedScenes;

  return (
    <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Animated background */}
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

      {/* Orchestrator */}
      {isActive && <ProgressOrchestrator />}

      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full px-6 items-center justify-center">
        {overallError ? (
          <ErrorState error={overallError} onRetry={() => router.replace("/create")} />
        ) : (
          <>
            {/* Progress ring */}
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

            {/* Status text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 w-full"
            >
              <StatusText phase={textPhase} />
            </motion.div>

            {/* Scene progress list */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 w-full space-y-2"
            >
              {SCENES.map((scene, i) => {
                const s = scenes[i];
                return (
                  <SceneRow
                    key={i}
                    label={scene.label}
                    status={s.status}
                    index={i}
                  />
                );
              })}
            </motion.div>

            {/* Finalize state */}
            {phase === "finalizing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <SceneRow label="Müzik & Son Dokunuş" status="generating-image" index={4} />
              </motion.div>
            )}

            {/* Time estimate */}
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

function SceneRow({
  label,
  status,
  index,
}: {
  label: string;
  status: string;
  index: number;
}) {
  const icons: Record<string, string> = {
    idle: "○",
    "generating-image": "◐",
    "generating-video": "◑",
    done: "●",
    error: "✕",
  };

  const colors: Record<string, string> = {
    idle: "text-white/20",
    "generating-image": "text-yellow-400",
    "generating-video": "text-violet-400",
    done: "text-green-400",
    error: "text-red-400",
  };

  const labels: Record<string, string> = {
    idle: "Bekliyor",
    "generating-image": "Görsel üretiliyor…",
    "generating-video": "Video üretiliyor…",
    done: "Hazır",
    error: "Hata — yeniden denenecek",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass rounded-[12px] px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg ${colors[status] ?? "text-white/20"}`}>
          {icons[status] ?? "○"}
        </span>
        <span className="text-[14px] text-white/80 font-medium">{label}</span>
      </div>
      <span className={`text-[12px] ${colors[status] ?? "text-white/20"}`}>
        {labels[status] ?? ""}
      </span>
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
      <div className="text-5xl">😔</div>
      <div>
        <h2 className="text-xl font-semibold text-white/90">Bir sorun çıktı</h2>
        <p className="text-sm text-white/50 mt-2">
          Merak etme, tekrar deneyebiliriz.
        </p>
        <p className="text-xs text-white/25 mt-1">{error}</p>
      </div>
      <Button size="lg" onClick={onRetry}>
        Yeniden Dene
      </Button>
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
