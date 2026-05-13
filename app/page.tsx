"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { hapticMedium, hapticLight } from "@/lib/utils/haptic";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/logo-mark";

const SLIDES = [
  {
    id: 0,
    illustration: <SlideOneIllustration />,
    title: "İki Fotoğraf",
    sub: "Senin ve onun yüzü — hepsi bu kadar",
  },
  {
    id: 1,
    illustration: <SlideTwoIllustration />,
    title: "En Güçlü AI",
    sub: "Dünyanın en gelişmiş modelleri sahneye taşır",
  },
  {
    id: 2,
    illustration: <SlideThreeIllustration />,
    title: "12 Saniye Aşk",
    sub: "İndir, paylaş — bu an sonsuza kalsın",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/create");
    });
  }, []);

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
    router.push("/auth");
  };

  const isLast = current === 2;

  return (
    <div className="page">
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

      {/* Header — wordmark + hero tagline */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 safe-top pt-4 px-6 text-center flex flex-col items-center gap-1"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="mb-0.5"
        >
          <LogoMark size={28} color="#FF375F" />
        </motion.div>
        <span className="text-[10px] font-bold tracking-[0.28em] uppercase"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          CineAmore
        </span>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          className="text-[17px] font-bold leading-tight text-center"
          style={{
            background: "linear-gradient(95deg, #FF375F 0%, #FF8C69 40%, #BF5AF2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.01em",
          }}
        >
          En gelişmiş AI ile sinematik<br />aşk hikayeni yarat
        </motion.p>
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
            className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none"
          >
            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="w-full flex items-center justify-center"
              style={{ height: "44vmax", maxHeight: 300 }}
            >
              {SLIDES[current].illustration}
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="text-center mt-5"
            >
              <h2
                className="text-[30px] font-bold text-white/95 leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                {SLIDES[current].title}
              </h2>
              <p className="text-[15px] text-white/45 mt-1.5">
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
        className="relative z-10 flex flex-col items-center gap-5 safe-bottom px-6 pb-6"
      >
        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{ width: i === current ? 22 : 6, opacity: i === current ? 1 : 0.35 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="h-[6px] rounded-full"
              style={{
                background: i === current
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
              className="w-full max-w-sm h-[58px] rounded-2xl font-semibold text-white text-[17px] glow-pulse flex items-center justify-center gap-2.5"
              style={{
                background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)",
                boxShadow: "0 0 32px rgba(255,55,95,0.35)",
              }}
            >
              Hikayemi Yarat
              <StarSparkSVG />
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

/* ─────────────────────────────────────────────────────────────
   SLIDE 1 — Two Portraits
───────────────────────────────────────────────────────────── */

function SlideOneIllustration() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Ambient glows */}
      <motion.div className="absolute pointer-events-none"
        style={{ left: "8%", top: "30%", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,55,95,0.22)", filter: "blur(36px)" }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute pointer-events-none"
        style={{ right: "8%", top: "30%", width: 120, height: 120, borderRadius: "50%", background: "rgba(191,90,242,0.22)", filter: "blur(36px)" }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
        transition={{ duration: 3.5, delay: 0.7, repeat: Infinity, ease: "easeInOut" }} />

      {/* Connection arc */}
      <svg className="absolute" style={{ width: "100%", height: "100%", top: 0, left: 0, pointerEvents: "none" }} viewBox="0 0 340 240">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF375F" stopOpacity="0.6" />
            <stop offset="45%" stopColor="#FF375F" stopOpacity="0" />
            <stop offset="55%" stopColor="#BF5AF2" stopOpacity="0" />
            <stop offset="100%" stopColor="#BF5AF2" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <motion.path d="M 88 120 Q 170 55 252 120"
          fill="none" stroke="url(#arcGrad)" strokeWidth="1.5" strokeDasharray="5 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 1.1, ease: "easeOut" }}
        />
      </svg>

      {/* Male portrait */}
      <motion.div
        initial={{ x: -32, opacity: 0, rotate: -7 }}
        animate={{ x: 0, opacity: 1, rotate: -7 }}
        transition={{ delay: 0.12, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: "absolute", left: "4%", transformOrigin: "bottom center" }}
      >
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <PortraitCard gender="male" color="#FF375F" label="SEN" />
        </motion.div>
      </motion.div>

      {/* Female portrait */}
      <motion.div
        initial={{ x: 32, opacity: 0, rotate: 7 }}
        animate={{ x: 0, opacity: 1, rotate: 7 }}
        transition={{ delay: 0.28, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: "absolute", right: "4%", transformOrigin: "bottom center" }}
      >
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}>
          <PortraitCard gender="female" color="#BF5AF2" label="O" />
        </motion.div>
      </motion.div>

      {/* Center heart */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 250, damping: 18 }}
      >
        <motion.div className="absolute rounded-full"
          style={{ width: 60, height: 60, border: "1px solid rgba(255,55,95,0.3)" }}
          animate={{ scale: [1, 1.65, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 60, height: 60, border: "1px solid rgba(191,90,242,0.25)" }}
          animate={{ scale: [1, 2.1, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, delay: 0.45, repeat: Infinity, ease: "easeOut" }} />
        <motion.div animate={{ scale: [1, 1.13, 1] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}>
          <HeartSVG />
        </motion.div>
      </motion.div>

      {/* Sparkles */}
      {[
        { x: "28%", y: "14%", delay: 1.1, color: "#FF375F", size: 13 },
        { x: "66%", y: "18%", delay: 1.4, color: "#BF5AF2", size: 11 },
        { x: "20%", y: "74%", delay: 1.7, color: "#FF9F0A", size: 10 },
        { x: "74%", y: "70%", delay: 2.0, color: "#BF5AF2", size: 12 },
      ].map((s, i) => (
        <motion.div key={i}
          className="absolute pointer-events-none"
          style={{ left: s.x, top: s.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -16, -32] }}
          transition={{ delay: s.delay, duration: 1.5, repeat: Infinity, repeatDelay: 2.8 + i * 0.35 }}
        >
          <SparkSVG color={s.color} size={s.size} />
        </motion.div>
      ))}
    </div>
  );
}

function PortraitCard({ gender, color, label }: { gender: "male" | "female"; color: string; label: string }) {
  return (
    <div className="relative flex flex-col items-center" style={{ width: 112, height: 155 }}>
      <div className="w-full h-full rounded-[24px] flex flex-col items-center justify-between py-3 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${color}1a 0%, ${color}08 100%)`,
          border: `1.5px solid ${color}50`,
          boxShadow: `0 10px 32px ${color}25, 0 2px 0 ${color}15 inset`,
        }}>
        {/* Film holes top */}
        <div className="flex gap-1.5 px-2.5 flex-shrink-0">
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 6, height: 4, borderRadius: 2, background: `${color}35`, border: `1px solid ${color}45` }} />
          ))}
        </div>
        {/* Portrait */}
        <div className="flex-1 flex items-center justify-center w-full px-1 py-1">
          {gender === "male" ? <MalePortraitSVG color={color} /> : <FemalePortraitSVG color={color} />}
        </div>
        {/* Film holes bottom */}
        <div className="flex gap-1.5 px-2.5 flex-shrink-0">
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 6, height: 4, borderRadius: 2, background: `${color}35`, border: `1px solid ${color}45` }} />
          ))}
        </div>
      </div>
      <div className="mt-2 text-[10px] font-bold tracking-[0.16em]" style={{ color: `${color}cc` }}>{label}</div>
      <motion.div
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 3px 12px ${color}55` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.65 + (gender === "female" ? 0.2 : 0), type: "spring", stiffness: 290 }}
      >
        <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ── Male Portrait — sharp, elegant, suited ── */
function MalePortraitSVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 72 92" fill="none" style={{ width: "86%", maxWidth: 76 }}>
      {/* Hair — layered, styled with side part */}
      <path d="M18 40 C17 22 21 11 36 9 C51 11 55 22 54 40" fill={`${color}2a`} stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M18 40 C18 26 20 15 28 11" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
      <path d="M36 9 C37 13 37 19 36 25" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.38"/>
      <path d="M54 40 C54 26 52 15 44 11" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
      {/* Face */}
      <path d="M19 40 C18 50 20 58 24 63 C28 68 33 70 36 70 C39 70 44 68 48 63 C52 58 54 50 53 40 Z"
        fill={`${color}0e`} stroke={color} strokeWidth="1.3"/>
      {/* Ears */}
      <path d="M19 43 C16 45 16 51 19 53" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.45"/>
      <path d="M53 43 C56 45 56 51 53 53" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.45"/>
      {/* Eyebrows — strong, defined */}
      <path d="M22 34 C25 32 29 32 32 34" stroke={color} strokeWidth="1.9" strokeLinecap="round" opacity="0.8"/>
      <path d="M40 34 C43 32 47 32 50 34" stroke={color} strokeWidth="1.9" strokeLinecap="round" opacity="0.8"/>
      {/* Eyes — upper lid arc + iris */}
      <path d="M22 39 C25 36.5 30 36.5 33 39" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="27.5" cy="40" rx="2.8" ry="2.5" fill={color} opacity="0.82"/>
      <circle cx="26.8" cy="39.3" r="0.8" fill="white" opacity="0.5"/>
      <path d="M39 39 C42 36.5 47 36.5 50 39" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="44.5" cy="40" rx="2.8" ry="2.5" fill={color} opacity="0.82"/>
      <circle cx="43.8" cy="39.3" r="0.8" fill="white" opacity="0.5"/>
      {/* Lashes */}
      <path d="M22 38 L21 36.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M25.5 37.2 L25.2 35.3" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M29.5 37 L30 35.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M39 38 L38 36.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M42.5 37.2 L42.2 35.3" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M46.5 37 L47 35.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      {/* Nose — bridge + tip */}
      <path d="M34 44 C33.5 47 33.5 50 35 52" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.4"/>
      <path d="M32 52 C33 54.5 39 54.5 40 52" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.48"/>
      {/* Lips — Cupid's bow + lower */}
      <path d="M28 59 C30 57 32.5 56.5 36 58 C39.5 56.5 42 57 44 59" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.72"/>
      <path d="M28 59 C30 62.5 36 63.5 44 59" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill={`${color}18`} opacity="0.65"/>
      {/* Chin */}
      <path d="M34.5 68 C35.5 70 36.5 70 37.5 68" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.28"/>
      {/* Neck */}
      <path d="M29 70 L29 79 L43 79 L43 70" fill={`${color}09`} stroke={color} strokeWidth="1.1"/>
      {/* Shirt collar points */}
      <path d="M25 75 L32 79 L36 73 L40 79 L47 75" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill={`${color}12`}/>
      {/* Tie — with knot detail */}
      <path d="M33.5 73 L36 71 L38.5 73 L36 82 Z" fill={`${color}2a`} stroke={color} strokeWidth="0.9"/>
      <path d="M33.5 73 L36 71.8 L38.5 73" stroke={color} strokeWidth="0.7" opacity="0.5"/>
      {/* Suit jacket */}
      <path d="M3 92 C7 74 17 73 29 73 L32 79 L36 73 L40 79 L43 73 C55 73 65 74 69 92 Z"
        fill={`${color}15`} stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      {/* Left lapel */}
      <path d="M29 73 L21 80 L26 87" stroke={color} strokeWidth="1.1" strokeLinejoin="round" fill={`${color}12`}/>
      {/* Right lapel */}
      <path d="M43 73 L51 80 L46 87" stroke={color} strokeWidth="1.1" strokeLinejoin="round" fill={`${color}12`}/>
      {/* Pocket square */}
      <path d="M45.5 79 L48 77 L49 81" stroke={color} strokeWidth="0.8" strokeLinejoin="round" opacity="0.48"/>
      {/* Button line */}
      <line x1="36" y1="83" x2="36" y2="92" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.28" strokeDasharray="2 2.5"/>
    </svg>
  );
}

/* ── Female Portrait — flowing hair, elegant, graceful ── */
function FemalePortraitSVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 72 92" fill="none" style={{ width: "86%", maxWidth: 76 }}>
      {/* Hair back layer — wide flowing */}
      <path d="M17 36 C13 52 14 68 16 78 C19 84 23 80 24 72" fill={`${color}20`} stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M55 36 C59 52 58 68 56 78 C53 84 49 80 48 72" fill={`${color}20`} stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      {/* Hair highlights */}
      <path d="M14 48 C15 56 16 64 17 72" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3"/>
      <path d="M58 48 C57 56 56 64 55 72" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3"/>
      {/* Hair top — voluminous */}
      <path d="M17 36 C16 16 21 9 36 7 C51 9 56 16 55 36" fill={`${color}2a`} stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      {/* Hair volume strands */}
      <path d="M36 7 C34 11 32 18 32 26" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
      <path d="M36 7 C38 11 40 18 40 24" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.35"/>
      <path d="M17 36 C18 24 22 14 30 10" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.38"/>
      <path d="M55 36 C54 24 50 14 42 10" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.38"/>
      {/* Face */}
      <path d="M20 37 C19 47 20 55 24 61 C28 67 33 70 36 70 C39 70 44 67 48 61 C52 55 53 47 52 37 Z"
        fill={`${color}0e`} stroke={color} strokeWidth="1.3"/>
      {/* Ears */}
      <path d="M20 40 C17 42 17 48 20 50" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M52 40 C55 42 55 48 52 50" stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.4"/>
      {/* Drop earrings */}
      <circle cx="18" cy="45" r="2.2" fill="none" stroke={color} strokeWidth="1.0" opacity="0.55"/>
      <path d="M18 47.2 L18 52" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
      <ellipse cx="18" cy="53.5" rx="1.5" ry="2" fill={`${color}40`} stroke={color} strokeWidth="0.8" opacity="0.55"/>
      <circle cx="54" cy="45" r="2.2" fill="none" stroke={color} strokeWidth="1.0" opacity="0.55"/>
      <path d="M54 47.2 L54 52" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
      <ellipse cx="54" cy="53.5" rx="1.5" ry="2" fill={`${color}40`} stroke={color} strokeWidth="0.8" opacity="0.55"/>
      {/* Eyebrows — arched, feminine */}
      <path d="M23 32 C26 29.5 30 29.5 33 32" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
      <path d="M39 32 C42 29.5 46 29.5 49 32" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
      {/* Eyes — upper lid, iris, lashes */}
      <path d="M23 37 C26 34.5 30 34.5 33 37" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="28" cy="37.8" rx="2.8" ry="2.5" fill={color} opacity="0.82"/>
      <circle cx="27.2" cy="37.1" r="0.8" fill="white" opacity="0.5"/>
      <path d="M39 37 C42 34.5 46 34.5 49 37" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <ellipse cx="44" cy="37.8" rx="2.8" ry="2.5" fill={color} opacity="0.82"/>
      <circle cx="43.2" cy="37.1" r="0.8" fill="white" opacity="0.5"/>
      {/* Long lashes — feminine */}
      <path d="M23 36.5 L22 34.5" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M25.5 35.5 L25 33.4" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M28.5 35 L28.3 32.8" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M31.5 35.5 L32 33.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      <path d="M39 36.5 L38 34.5" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M41.5 35.5 L41 33.4" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M44.5 35 L44.3 32.8" stroke={color} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M47.5 35.5 L48 33.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      {/* Nose — soft, refined */}
      <path d="M34 42 C33.5 44.5 33.5 47.5 35 49.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.35"/>
      <path d="M32 49.5 C33 51.5 39 51.5 40 49.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.42"/>
      {/* Lips — fuller, defined */}
      <path d="M27.5 57 C29.5 55 32 54.5 36 56 C40 54.5 42.5 55 44.5 57" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.72"/>
      <path d="M27.5 57 C29.5 61 36 62.5 44.5 57" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill={`${color}20`} opacity="0.7"/>
      {/* Lower lip highlight */}
      <path d="M32 60.5 C34 61.8 38 61.8 40 60.5" stroke={color} strokeWidth="0.6" strokeLinecap="round" opacity="0.3"/>
      {/* Neck */}
      <path d="M29 70 L29 77 L43 77 L43 70" fill={`${color}09`} stroke={color} strokeWidth="1.1"/>
      {/* Elegant neckline / dress */}
      <path d="M3 92 C7 74 17 72 29 72 L36 80 L43 72 C55 72 65 74 69 92 Z"
        fill={`${color}12`} stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      {/* Dress V-neckline detail */}
      <path d="M29 72 L36 80 L43 72" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dress fabric lines (elegant drape) */}
      <path d="M20 80 C22 84 24 88 22 92" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.28"/>
      <path d="M52 80 C50 84 48 88 50 92" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.28"/>
      {/* Necklace pendant */}
      <path d="M29 73 Q36 76 43 73" stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.35" fill="none"/>
      <circle cx="36" cy="76" r="1.2" fill={`${color}50`} stroke={color} strokeWidth="0.6" opacity="0.5"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 2 — AI Flow
───────────────────────────────────────────────────────────── */

const FLOW_STEPS = [
  {
    color: "#FF375F",
    delay: 0.08,
    label: "Yüzler tanınır ve modele aktarılır",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M3 20a9 9 0 0 1 18 0" strokeLinecap="round" />
        <path d="M15 5.5c1.5.8 2.5 2.3 2.5 4" strokeLinecap="round" opacity=".5" />
      </svg>
    ),
  },
  {
    color: "#FF9F0A",
    delay: 0.18,
    label: "4 sinematik sahne oluşturulur",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    color: "#BF5AF2",
    delay: 0.28,
    label: "Sinematik müzik eklenir",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" />
        <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    color: "#30D158",
    delay: 0.38,
    label: "12 saniyelik hikaye hazır",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="2" y="4" width="15" height="16" rx="3" />
        <path d="M17 8.5l5-3v13l-5-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10l4 2.5L8 15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function SlideTwoIllustration() {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[290px]">
      {/* AI badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center gap-2 mb-1"
      >
        <motion.div
          className="h-[1px] flex-1 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,55,95,0.5))" }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-2"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          Higgsfield · GPT-4o
        </span>
        <motion.div
          className="h-[1px] flex-1 rounded-full"
          style={{ background: "linear-gradient(90deg, rgba(191,90,242,0.5), transparent)" }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </motion.div>

      {FLOW_STEPS.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: step.delay, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex items-center gap-3 rounded-[14px] px-4 py-3 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${step.color}1a 50%, transparent 100%)` }}
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ delay: step.delay + 0.2, duration: 0.9, ease: "easeOut" }}
          />
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{ background: `${step.color}22`, color: step.color }}>
            {i + 1}
          </div>
          <span className="flex-1 text-[13px] font-medium leading-tight" style={{ color: "rgba(255,255,255,0.78)" }}>
            {step.label}
          </span>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: step.delay + 0.35, type: "spring", stiffness: 350 }}
            style={{ color: step.color }}
          >
            {step.icon}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SLIDE 3 — Share/Result
───────────────────────────────────────────────────────────── */

function SlideThreeIllustration() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Floating hearts & sparks (SVG, no emojis) */}
      {[
        { x: "22%", delay: 0.9, type: "heart" },
        { x: "50%", delay: 1.3, type: "spark" },
        { x: "76%", delay: 1.7, type: "heart" },
      ].map((item, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: item.x, bottom: "12%" }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [-8, -70, -140], opacity: [0, 0.85, 0], x: [0, (i - 1) * 14, (i - 1) * 22] }}
          transition={{ delay: item.delay, duration: 2.0, repeat: Infinity, repeatDelay: 1.0, ease: "easeOut" }}
        >
          {item.type === "heart"
            ? <SmallHeartSVG color={i === 0 ? "#FF375F" : "#BF5AF2"} />
            : <SparkSVG color="#FF9F0A" size={10} />
          }
        </motion.div>
      ))}

      {/* Phone frame */}
      <motion.div
        className="relative rounded-[28px] overflow-hidden"
        style={{
          width: 144, height: 228,
          background: "rgba(255,255,255,0.04)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
        }}
        initial={{ y: 10, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(255,55,95,0.35) 0%, rgba(0,0,0,0.7) 50%, rgba(191,90,242,0.25) 100%)" }} />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-3">
          <div className="flex gap-2.5">
            <motion.div className="w-10 h-10 rounded-full"
              style={{ background: "linear-gradient(135deg, #FF375F, #FF9F0A)" }}
              animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <motion.div className="w-10 h-10 rounded-full"
              style={{ background: "linear-gradient(135deg, #BF5AF2, #5E5CE6)" }}
              animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, delay: 0.55, repeat: Infinity }} />
          </div>
          <div className="w-16 h-1 rounded-full bg-white/15 mt-1" />
          <div className="w-20 h-0.5 rounded-full bg-white/8" />
        </div>

        {/* Play button */}
        <motion.div className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <motion.div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
            animate={{ scale: [1, 1.09, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div className="h-full"
            style={{ background: "linear-gradient(90deg, #FF375F, #BF5AF2)" }}
            initial={{ width: "0%" }} animate={{ width: "68%" }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Share badge */}
      <motion.div
        className="absolute bottom-6 right-5 rounded-2xl px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}
        initial={{ opacity: 0, x: 20, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-white/65 font-medium">Paylaş</span>
      </motion.div>

      {/* Download badge */}
      <motion.div
        className="absolute top-6 left-5 rounded-2xl px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.25)", backdropFilter: "blur(10px)" }}
        initial={{ opacity: 0, x: -20, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <svg width="14" height="14" fill="none" stroke="#30D158" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-medium" style={{ color: "#30D158" }}>İndir</span>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Small utility SVGs
───────────────────────────────────────────────────────────── */

function HeartSVG() {
  return (
    <svg width="42" height="38" viewBox="0 0 42 38" fill="none">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF375F"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M21 35 C21 35 2 23 2 11.5 C2 6.5 6.5 2.5 11.5 2.5 C15 2.5 18 4.5 19.5 7.5 L21 10 L22.5 7.5 C24 4.5 27 2.5 30.5 2.5 C35.5 2.5 40 6.5 40 11.5 C40 23 21 35 21 35Z"
        fill="url(#heartGrad)" opacity="0.92"/>
      <path d="M21 35 C21 35 2 23 2 11.5 C2 6.5 6.5 2.5 11.5 2.5 C15 2.5 18 4.5 19.5 7.5 L21 10 L22.5 7.5 C24 4.5 27 2.5 30.5 2.5 C35.5 2.5 40 6.5 40 11.5 C40 23 21 35 21 35Z"
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
      <path d="M11 10 Q14 7 18 9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SmallHeartSVG({ color }: { color: string }) {
  return (
    <svg width="16" height="15" viewBox="0 0 16 15" fill="none">
      <path d="M8 13.5 C8 13.5 1 9 1 4.5 C1 2.5 2.8 1 5 1 C6.3 1 7.4 1.7 8 2.8 L8 2.8 C8.6 1.7 9.7 1 11 1 C13.2 1 15 2.5 15 4.5 C15 9 8 13.5 8 13.5Z"
        fill={color} opacity="0.85"/>
    </svg>
  );
}

function SparkSVG({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M6 0.5 L7 4.8 L11.5 6 L7 7.2 L6 11.5 L5 7.2 L0.5 6 L5 4.8 Z" fill={color} opacity="0.85"/>
    </svg>
  );
}

function StarSparkSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1 L9.2 6.2 L14.5 8 L9.2 9.8 L8 15 L6.8 9.8 L1.5 8 L6.8 6.2 Z" fill="rgba(255,255,255,0.9)"/>
      <path d="M13 2 L13.6 4.2 L15.8 5 L13.6 5.8 L13 8 L12.4 5.8 L10.2 5 L12.4 4.2 Z" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

function Particles() {
  const pts = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.5) % 100}%`,
    top: `${(i * 11.8) % 100}%`,
    size: (i % 3) + 1.5,
    delay: (i * 0.32) % 4,
    dur: (i % 3) + 3.5,
    color: i % 2 === 0 ? "rgba(255,55,95,0.38)" : "rgba(191,90,242,0.38)",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color }}
          animate={{ y: [-8, -52, -8], opacity: [0, 0.65, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
