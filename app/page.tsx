"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { hapticMedium, hapticLight } from "@/lib/utils/haptic";

const SLIDES = [
  {
    id: 0,
    illustration: <SlideOneIllustration />,
    title: "İki Fotoğraf",
    sub: "Onun ve senin yüzün",
  },
  {
    id: 1,
    illustration: <SlideTwoIllustration />,
    title: "AI Sihri",
    sub: "4 sinematik sahne üretilir",
  },
  {
    id: 2,
    illustration: <SlideThreeIllustration />,
    title: "Videon Hazır",
    sub: "İndir, paylaş, hissettir",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const dragX = useMotionValue(0);

  const goTo = (i: number) => {
    if (i === current) return;
    hapticLight();
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = info.offset.x + info.velocity.x * 0.3;
    if (swipe < -40 && current < 2) goTo(current + 1);
    else if (swipe > 40 && current > 0) goTo(current - 1);
    dragX.set(0);
  };

  const handleStart = () => {
    hapticMedium();
    router.push("/create");
  };

  const isLast = current === 2;

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 80% 55% at 50% 35%, rgba(255,55,95,0.18) 0%, rgba(191,90,242,0.10) 50%, transparent 70%)",
              "radial-gradient(ellipse 80% 55% at 50% 35%, rgba(191,90,242,0.18) 0%, rgba(255,55,95,0.10) 50%, transparent 70%)",
              "radial-gradient(ellipse 80% 55% at 50% 35%, rgba(255,55,95,0.18) 0%, rgba(191,90,242,0.10) 50%, transparent 70%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <Particles />
      </div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 pt-14 text-center"
      >
        <span
          className="text-[13px] font-semibold tracking-[0.22em] uppercase"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          CineAmore
        </span>
      </motion.div>

      {/* Slider */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none"
          >
            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="w-full flex items-center justify-center"
              style={{ height: "46vmax", maxHeight: 320 }}
            >
              {SLIDES[current].illustration}
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="text-center mt-6"
            >
              <h2
                className="text-[32px] font-bold text-white/95 leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                {SLIDES[current].title}
              </h2>
              <p className="text-[15px] text-white/45 mt-2">
                {SLIDES[current].sub}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 flex flex-col items-center gap-5 pb-12 px-6"
      >
        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{
                width: i === current ? 22 : 6,
                opacity: i === current ? 1 : 0.35,
              }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="h-[6px] rounded-full"
              style={{
                background:
                  i === current
                    ? "linear-gradient(90deg, #FF375F, #BF5AF2)"
                    : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <AnimatePresence mode="wait">
          {isLast ? (
            <motion.button
              key="start"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              onClick={handleStart}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-sm h-[58px] rounded-2xl font-semibold text-white text-[17px] glow-pulse"
              style={{
                background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)",
                boxShadow: "0 0 32px rgba(255,55,95,0.35)",
              }}
            >
              Hikayemi Yarat ✨
            </motion.button>
          ) : (
            <motion.button
              key="next"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              onClick={() => goTo(current + 1)}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-sm h-[58px] rounded-2xl font-semibold text-white/80 text-[17px]"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Devam
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0 }),
};

/* ─── Slide Illustrations ─── */

function SlideOneIllustration() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Connection line */}
      <motion.div
        className="absolute"
        style={{ width: 80, height: 2, background: "linear-gradient(90deg, rgba(255,55,95,0.6), rgba(191,90,242,0.6))" }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      />

      {/* Heart in center */}
      <motion.div
        className="absolute z-10 text-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🤍
        </motion.span>
      </motion.div>

      {/* Left avatar */}
      <motion.div
        className="absolute"
        style={{ left: "18%" }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <AvatarCircle color="#FF375F" label="Sen" emoji="🧑" delay={0.2} />
      </motion.div>

      {/* Right avatar */}
      <motion.div
        className="absolute"
        style={{ right: "18%" }}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <AvatarCircle color="#BF5AF2" label="O" emoji="👩" delay={0.35} />
      </motion.div>
    </div>
  );
}

function AvatarCircle({ color, label, emoji, delay }: { color: string; label: string; emoji: string; delay: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 96,
          height: 96,
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          border: `2px solid ${color}55`,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${color}30`,
            `0 0 40px ${color}55`,
            `0 0 20px ${color}30`,
          ],
        }}
        transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px dashed ${color}40` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-4xl">{emoji}</span>
        {/* Upload indicator */}
        <motion.div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{ background: color, boxShadow: `0 2px 8px ${color}66` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.4, type: "spring", stiffness: 300 }}
        >
          +
        </motion.div>
      </motion.div>
      <span className="text-sm font-medium text-white/50">{label}</span>
    </div>
  );
}

function SlideTwoIllustration() {
  const frames = [
    { emoji: "🏜️", label: "Çöl", color: "#FF375F", delay: 0.1 },
    { emoji: "✨", label: "Dokunuş", color: "#FF9F0A", delay: 0.3 },
    { emoji: "👀", label: "Bakış", color: "#BF5AF2", delay: 0.5 },
    { emoji: "🌹", label: "Gül", color: "#30D158", delay: 0.7 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
      {frames.map((f, i) => (
        <motion.div
          key={i}
          className="relative rounded-[16px] overflow-hidden flex flex-col items-center justify-center"
          style={{
            height: 100,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: f.delay, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, transparent 0%, ${f.color}22 50%, transparent 100%)`,
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ delay: f.delay + 0.3, duration: 1.4, ease: "easeInOut" }}
          />
          {/* Generated indicator */}
          <motion.div
            className="absolute inset-0"
            style={{ background: `${f.color}0a` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: f.delay + 0.6, duration: 0.3 }}
          />
          <span className="text-3xl z-10">{f.emoji}</span>
          {/* AI spark */}
          <motion.div
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            style={{ background: f.color }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: f.delay + 0.7, type: "spring", stiffness: 400 }}
          >
            ✦
          </motion.div>
          <span className="text-[11px] text-white/40 mt-1 z-10">{f.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function SlideThreeIllustration() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Floating hearts */}
      {["❤️", "✨", "💫"].map((e, i) => (
        <motion.div
          key={i}
          className="absolute text-xl pointer-events-none"
          style={{
            left: `${25 + i * 25}%`,
            bottom: "15%",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [-10, -60, -120],
            opacity: [0, 0.8, 0],
            x: [0, (i - 1) * 12, (i - 1) * 20],
          }}
          transition={{
            delay: 0.8 + i * 0.4,
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "easeOut",
          }}
        >
          {e}
        </motion.div>
      ))}

      {/* Phone frame */}
      <motion.div
        className="relative rounded-[28px] overflow-hidden"
        style={{
          width: 140,
          height: 220,
          background: "rgba(255,255,255,0.04)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        initial={{ y: 10, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Video gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(255,55,95,0.35) 0%, rgba(0,0,0,0.7) 50%, rgba(191,90,242,0.25) 100%)",
          }}
        />

        {/* Simulated video content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
          <div className="flex gap-2">
            <motion.div
              className="w-9 h-9 rounded-full"
              style={{ background: "linear-gradient(135deg, #FF375F, #FF9F0A)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="w-9 h-9 rounded-full"
              style={{ background: "linear-gradient(135deg, #BF5AF2, #5E5CE6)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
            />
          </div>
          <div className="w-16 h-1 rounded-full bg-white/15 mt-1" />
          <div className="w-20 h-1 rounded-full bg-white/08" />
        </div>

        {/* Play button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, #FF375F, #BF5AF2)" }}
            initial={{ width: "0%" }}
            animate={{ width: "65%" }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Share badge */}
      <motion.div
        className="absolute bottom-8 right-6 rounded-2xl px-3 py-2 flex items-center gap-1.5"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
        }}
        initial={{ opacity: 0, x: 20, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <span className="text-sm">📤</span>
        <span className="text-xs text-white/60 font-medium">Paylaş</span>
      </motion.div>
    </div>
  );
}

function Particles() {
  const pts = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${(i * 7.1) % 100}%`,
    top: `${(i * 13.7) % 100}%`,
    size: (i % 3) + 1.5,
    delay: (i * 0.35) % 4,
    dur: (i % 3) + 3.5,
    color: i % 2 === 0 ? "rgba(255,55,95,0.35)" : "rgba(191,90,242,0.35)",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color }}
          animate={{ y: [-8, -48, -8], opacity: [0, 0.6, 0], scale: [1, 1.4, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
