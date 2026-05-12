"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { hapticMedium } from "@/lib/utils/haptic";

export default function LandingPage() {
  const router = useRouter();

  const handleStart = () => {
    hapticMedium();
    router.push("/create");
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black flex flex-col">
      {/* Background atmosphere */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,55,95,0.18) 0%, rgba(191,90,242,0.12) 40%, transparent 70%)",
          }}
        />
        <Particles />
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full px-6">

        {/* Top wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="pt-14"
        >
          <span
            className="text-[15px] font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em" }}
          >
            CineAmore
          </span>
        </motion.div>

        {/* Center hero area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          {/* Preview frames stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-48 h-72"
          >
            {[
              { rotate: -8, scale: 0.9, zIndex: 0, opacity: 0.4 },
              { rotate: -4, scale: 0.95, zIndex: 1, opacity: 0.6 },
              { rotate: 0, scale: 1, zIndex: 2, opacity: 1 },
            ].map((style, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-[20px] glass overflow-hidden"
                style={{
                  transform: `rotate(${style.rotate}deg) scale(${style.scale})`,
                  zIndex: style.zIndex,
                  opacity: style.opacity,
                }}
                animate={
                  i === 2
                    ? {
                        boxShadow: [
                          "0 0 30px rgba(255,55,95,0.15)",
                          "0 0 60px rgba(191,90,242,0.25)",
                          "0 0 30px rgba(255,55,95,0.15)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      i === 2
                        ? "linear-gradient(160deg, rgba(255,55,95,0.3) 0%, rgba(0,0,0,0.8) 50%, rgba(191,90,242,0.2) 100%)"
                        : "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.6) 100%)",
                  }}
                />
                {i === 2 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 opacity-80" />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 opacity-80" />
                    </div>
                    <div className="w-20 h-1 rounded-full bg-white/10 mt-1" />
                    <div className="w-28 h-1 rounded-full bg-white/5" />
                  </div>
                )}
                {i === 2 && (
                  <div className="absolute bottom-4 right-4 text-2xl select-none">
                    🌹
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-3"
          >
            <h1
              className="text-4xl font-bold leading-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              Aşk Hikayenizi
              <br />
              <span className="gradient-accent-text">12 Saniyede</span>
              <br />
              Yaratın
            </h1>
            <p className="text-[15px] text-white/55 leading-relaxed max-w-xs mx-auto">
              İki fotoğraf yükleyin — AI sinematik bir aşk hikayesi videosu üretsin.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {["4 Sinematik Sahne", "Kimlik Korunur", "TikTok & Reels"].map((tag) => (
              <span
                key={tag}
                className="glass px-3 py-1.5 rounded-full text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.32, 0.72, 0, 1] }}
          className="pb-12 space-y-4"
        >
          <Button size="xl" fullWidth onClick={handleStart} className="glow-pulse">
            Hikayemi Yarat ✨
          </Button>
          <p className="text-center text-xs text-white/30">
            Fotoğraflarınız 1 saat içinde silinir · Ücretsiz deneyin
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Particles() {
  const items = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.25) % 100}%`,
    top: `${(i * 11.3) % 100}%`,
    size: (i % 3) + 1.5,
    delay: (i * 0.4) % 4,
    duration: (i % 3) + 3.5,
    color: i % 2 === 0 ? "rgba(255,55,95,0.4)" : "rgba(191,90,242,0.4)",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          animate={{ y: [-10, -50, -10], opacity: [0, 0.7, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
