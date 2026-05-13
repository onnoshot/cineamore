"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { hapticMedium, hapticLight } from "@/lib/utils/haptic";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   Ambient blobs — float slowly behind all content
───────────────────────────────────────────────────────────── */
function AmbientBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 380, height: 380,
          top: -80, left: -80,
          background: "radial-gradient(circle, rgba(255,55,95,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 28, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 340, height: 340,
          top: "35%", right: -100,
          background: "radial-gradient(circle, rgba(191,90,242,0.20) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -22, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260, height: 260,
          bottom: "20%", left: "10%",
          background: "radial-gradient(circle, rgba(255,159,10,0.12) 0%, transparent 70%)",
          filter: "blur(45px)",
        }}
        animate={{ x: [0, 18, 0], y: [0, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 7 }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Glass card wrapper
───────────────────────────────────────────────────────────── */
function GlassCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Gradient text helper
───────────────────────────────────────────────────────────── */
function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: "linear-gradient(100deg, #FF375F 0%, #FF8C69 38%, #BF5AF2 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Logo mark SVG
───────────────────────────────────────────────────────────── */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="lgLogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF375F" />
          <stop offset="100%" stopColor="#BF5AF2" />
        </linearGradient>
      </defs>
      <path
        d="M16 28 C16 28 3 19.5 3 10.5 C3 7 5.8 4 9.5 4 C12 4 14.2 5.5 15.2 7.6 L16 9 L16.8 7.6 C17.8 5.5 20 4 22.5 4 C26.2 4 29 7 29 10.5 C29 19.5 16 28 16 28Z"
        fill="url(#lgLogo)"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero illustration — two portrait silhouettes converging
───────────────────────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 200 }}>
      {/* Glow rings */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 160, height: 160, border: "1px solid rgba(255,55,95,0.20)" }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 160, height: 160, border: "1px solid rgba(191,90,242,0.18)" }}
        animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
        transition={{ duration: 3, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Left silhouette (male) */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: "absolute", left: "8%" }}
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
          <svg viewBox="0 0 64 90" fill="none" style={{ width: 72, height: 100 }}>
            <defs>
              <linearGradient id="hmg" x1="0" y1="0" x2="64" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="26" rx="16" ry="18" fill="url(#hmg)" opacity="0.9" />
            <path d="M8 90 C8 65 16 58 32 58 C48 58 56 65 56 90Z" fill="url(#hmg)" opacity="0.7" />
            <circle cx="32" cy="24" r="10" fill="rgba(10,132,255,0.25)" />
            <rect x="20" y="32" width="24" height="3" rx="1.5" fill="rgba(10,132,255,0.5)" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Center heart */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 220, damping: 16 }}
        className="relative z-10"
      >
        <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
            <defs>
              <linearGradient id="hg2" x1="0" y1="0" x2="44" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF375F" />
                <stop offset="100%" stopColor="#BF5AF2" />
              </linearGradient>
            </defs>
            <path d="M22 37C22 37 2 24 2 12C2 7 6 3 11 3C15 3 18.5 5.5 20.5 9L22 11.5L23.5 9C25.5 5.5 29 3 33 3C38 3 42 7 42 12C42 24 22 37 22 37Z"
              fill="url(#hg2)" />
            <path d="M11 9Q14 6 18 8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Right silhouette (female) */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: "absolute", right: "8%" }}
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}>
          <svg viewBox="0 0 64 90" fill="none" style={{ width: 72, height: 100 }}>
            <defs>
              <linearGradient id="hfg" x1="0" y1="0" x2="64" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF375F" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FF375F" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Hair */}
            <path d="M12 28 C10 10 16 4 32 2 C48 4 54 10 52 28" fill="rgba(255,55,95,0.35)" />
            <ellipse cx="32" cy="32" rx="16" ry="18" fill="url(#hfg)" opacity="0.88" />
            <path d="M6 90 C8 65 18 58 32 58 C46 58 56 65 58 90Z" fill="url(#hfg)" opacity="0.7" />
            {/* Flowing hair strands */}
            <path d="M12 28 Q8 50 10 70" stroke="rgba(255,55,95,0.4)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M52 28 Q56 50 54 70" stroke="rgba(255,55,95,0.4)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Floating sparkles */}
      {[
        { x: "18%", y: "20%", delay: 1.2, color: "#FF375F", size: 10 },
        { x: "76%", y: "15%", delay: 1.6, color: "#BF5AF2", size: 8 },
        { x: "55%", y: "80%", delay: 1.0, color: "#FF9F0A", size: 9 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: s.x, top: s.y }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -18, -36] }}
          transition={{ delay: s.delay, duration: 1.8, repeat: Infinity, repeatDelay: 2.5 + i * 0.5 }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 12 12" fill="none">
            <path d="M6 0.5L7 4.8L11.5 6L7 7.2L6 11.5L5 7.2L0.5 6L5 4.8Z" fill={s.color} opacity="0.9" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Step indicator for How It Works
───────────────────────────────────────────────────────────── */
function StepCard({
  number,
  color,
  title,
  desc,
  icon,
  delay,
}: {
  number: number;
  color: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
    >
      <GlassCard className="p-4 flex items-start gap-3.5">
        {/* Step number + icon */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center"
            style={{ background: `${color}22`, color }}
          >
            {icon}
          </div>
          <div
            className="text-[10px] font-bold tabular-nums"
            style={{ color: `${color}99` }}
          >
            0{number}
          </div>
        </div>
        {/* Text */}
        <div className="flex-1 pt-0.5">
          <p className="text-[15px] font-semibold text-white/90 leading-tight" style={{ letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p className="text-[13px] text-white/40 mt-1 leading-snug">{desc}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Feature card
───────────────────────────────────────────────────────────── */
function FeatureCard({
  color,
  title,
  desc,
  icon,
  delay,
}: {
  color: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <GlassCard className="p-4 h-full" style={{ borderColor: `${color}20` }}>
        <div
          className="w-9 h-9 rounded-[12px] flex items-center justify-center mb-3"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <p className="text-[14px] font-semibold text-white/88" style={{ letterSpacing: "-0.01em" }}>{title}</p>
        <p className="text-[12px] text-white/38 mt-1 leading-relaxed">{desc}</p>
      </GlassCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Credit system visual
───────────────────────────────────────────────────────────── */
function CreditVisual() {
  const tiers = [
    { credits: 1, label: "Başlangıç", color: "#30D158", desc: "Ücretsiz — kayıt hediyesi" },
    { credits: 5, label: "Mini Paket", color: "#0A84FF", desc: "5 hikaye / ₺49" },
    { credits: 20, label: "Aile Paketi", color: "#BF5AF2", desc: "20 hikaye / ₺149" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-3"
    >
      {tiers.map((tier, i) => (
        <GlassCard key={i} className="px-4 py-3.5 flex items-center gap-3.5">
          {/* Credit count badge */}
          <div
            className="w-12 h-12 rounded-[16px] flex flex-col items-center justify-center flex-shrink-0"
            style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}30` }}
          >
            <span className="text-[20px] font-black leading-none" style={{ color: tier.color }}>
              {tier.credits}
            </span>
            <span className="text-[8px] font-semibold tracking-wider uppercase" style={{ color: `${tier.color}80` }}>
              kredi
            </span>
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-white/88">{tier.label}</p>
              {i === 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide"
                  style={{ background: `${tier.color}22`, color: tier.color }}
                >
                  ÜCRETSİZ
                </span>
              )}
            </div>
            <p className="text-[12px] text-white/40 mt-0.5">{tier.desc}</p>
          </div>
          {/* Film strip icon */}
          <div style={{ color: `${tier.color}60` }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <rect x="2" y="4" width="15" height="16" rx="3" />
              <path d="M17 8.5l5-3v13l-5-3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 10l4 2.5L8 15" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </GlassCard>
      ))}

      {/* Note */}
      <p className="text-center text-[12px] text-white/30 px-2">
        Her kredi = 1 sinematik aşk videosu (4 sahne + müzik)
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section heading
───────────────────────────────────────────────────────────── */
function SectionHeading({ label, title, sub }: { label: string; title: React.ReactNode; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      className="text-center mb-5"
    >
      <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>
        {label}
      </p>
      <h2 className="text-[26px] font-bold text-white/92 leading-tight" style={{ letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {sub && <p className="text-[14px] text-white/40 mt-1.5">{sub}</p>}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Divider line
───────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div className="flex items-center gap-3 px-6 my-2">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08))" }} />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 0.5L7 4.8L11.5 6L7 7.2L6 11.5L5 7.2L0.5 6L5 4.8Z" fill="rgba(255,55,95,0.5)" />
      </svg>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [authed, setAuthed] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 60], [0, 1]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }, []);

  const handleCta = () => {
    hapticMedium();
    setCtaLoading(true);
    router.push(authed ? "/create" : "/auth");
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#0a0a0f" }}
    >
      <AmbientBlobs />

      {/* Sticky nav bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
        style={{
          opacity: navOpacity,
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="text-[13px] font-bold text-white/80" style={{ letterSpacing: "-0.01em" }}>CineAmore</span>
        </div>
        <motion.button
          onClick={handleCta}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-1.5 rounded-full text-[12px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #FF375F, #BF5AF2)" }}
        >
          {authed ? "Oluştur" : "Giriş Yap"}
        </motion.button>
      </motion.div>

      {/* Scroll content */}
      <div className="relative z-10 pb-16">

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="px-5 pt-16 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Logo + wordmark */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="mb-3"
            >
              <LogoMark size={44} />
            </motion.div>

            {/* Pill label */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(255,55,95,0.12)", border: "1px solid rgba(255,55,95,0.25)" }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#FF375F" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: "#FF375F" }}>
                AI ile sinematik video
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="text-[36px] font-black leading-[1.10] mb-3"
              style={{ letterSpacing: "-0.03em" }}
            >
              <GradientText>İki fotoğraf,</GradientText>
              <br />
              <span className="text-white/92">sonsuz bir aşk</span>
              <br />
              <span className="text-white/92">hikayesi</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              className="text-[15px] text-white/45 leading-relaxed max-w-[280px] mb-7"
            >
              İki kişinin yüz fotoğrafından 4 sinematik sahne, müzik eşliğinde 12 saniyelik video.
            </motion.p>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              onClick={handleCta}
              disabled={ctaLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-xs h-[58px] rounded-2xl text-white text-[17px] font-semibold flex items-center justify-center gap-2.5"
              style={{
                background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)",
                boxShadow: "0 4px 40px rgba(255,55,95,0.38)",
              }}
            >
              {ctaLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <>
                  Hikayemi Yarat
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L9.2 6.2L14.5 8L9.2 9.8L8 15L6.8 9.8L1.5 8L6.8 6.2Z" fill="rgba(255,255,255,0.9)" />
                  </svg>
                </>
              )}
            </motion.button>

            {/* Trust hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-[11px] text-white/28 mt-3"
            >
              1 kredi ücretsiz · Kredi kartı gerekmez
            </motion.p>
          </motion.div>

          {/* Hero illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="mt-6"
          >
            <HeroIllustration />
          </motion.div>
        </section>

        <Divider />

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section className="px-5 pt-6 pb-4">
          <SectionHeading
            label="Nasıl Çalışır"
            title={<><GradientText>4 adımda</GradientText> hazır</>}
            sub="Ortalama süre: 3–5 dakika"
          />

          <div className="flex flex-col gap-2.5">
            <StepCard
              number={1}
              color="#FF375F"
              title="Fotoğraf Yükle"
              desc="Erkeğin ve kadının net, ön cepheden bir fotoğrafı yeter."
              delay={0}
              icon={
                <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M3 20a9 9 0 0 1 18 0" strokeLinecap="round" />
                </svg>
              }
            />
            <StepCard
              number={2}
              color="#FF9F0A"
              title="AI Yüzleri Tanır"
              desc="Higgsfield'ın soul_2 modeli kimliği koruyarak sahnelere işler."
              delay={0.07}
              icon={
                <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" strokeLinejoin="round" />
                </svg>
              }
            />
            <StepCard
              number={3}
              color="#BF5AF2"
              title="4 Sinematik Sahne"
              desc="Romantik mekanlar, sinematik ışık — tamamen AI üretimi."
              delay={0.14}
              icon={
                <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="15" height="16" rx="3" />
                  <path d="M17 8.5l5-3v13l-5-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <StepCard
              number={4}
              color="#30D158"
              title="İndir ve Paylaş"
              desc="9:16 dikey format, Instagram / TikTok / WhatsApp için hazır."
              delay={0.21}
              icon={
                <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </section>

        <Divider />

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section className="px-5 pt-6 pb-4">
          <SectionHeading
            label="Özellikler"
            title={<>Neden <GradientText>CineAmore</GradientText>?</>}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <FeatureCard
              color="#FF375F"
              title="Kimlik Korumalı"
              desc="Yüz özellikleri aynen aktarılır, yapay görünmez."
              delay={0}
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M3 20a9 9 0 0 1 18 0" strokeLinecap="round" />
                  <path d="M17 3l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <FeatureCard
              color="#30D158"
              title="Gizlilik"
              desc="Görseller işlem sonrası silinir. 3. taraflarla paylaşılmaz."
              delay={0.07}
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
            <FeatureCard
              color="#0A84FF"
              title="Sinematik Kalite"
              desc="4K sahne görselleri, akıcı 4 saniyelik video klipleri."
              delay={0.14}
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              }
            />
            <FeatureCard
              color="#BF5AF2"
              title="Sosyal Medya Hazır"
              desc="9:16 dikey — Reels, TikTok, Stories için optimize."
              delay={0.21}
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <rect x="5" y="2" width="14" height="20" rx="4" />
                  <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="mt-4"
          >
            <GlassCard className="px-5 py-4">
              <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
                {[
                  { val: "4", unit: "sahne", sub: "her video" },
                  { val: "12s", unit: "video", sub: "finalinde" },
                  { val: "9:16", unit: "format", sub: "dikey" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center px-2">
                    <span className="text-[24px] font-black" style={{ letterSpacing: "-0.03em" }}>
                      <GradientText>{s.val}</GradientText>
                    </span>
                    <span className="text-[11px] text-white/55 font-medium">{s.unit}</span>
                    <span className="text-[10px] text-white/28">{s.sub}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </section>

        <Divider />

        {/* ── CREDIT SYSTEM ────────────────────────────────── */}
        <section className="px-5 pt-6 pb-4">
          <SectionHeading
            label="Kredi Sistemi"
            title={<><GradientText>Ödeme</GradientText> nasıl çalışır?</>}
            sub="Abonelik yok — sadece kullandığın kadar öde"
          />

          <CreditVisual />
        </section>

        <Divider />

        {/* ── SECURITY SECTION ─────────────────────────────── */}
        <section className="px-5 pt-6 pb-4">
          <SectionHeading
            label="Güvenlik"
            title={<>Verilerini <GradientText>koruyoruz</GradientText></>}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col gap-3"
          >
            {[
              {
                color: "#30D158",
                title: "TLS Şifreleme",
                desc: "Tüm veri transferi end-to-end şifreli.",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                color: "#FF9F0A",
                title: "Otomatik Silme",
                desc: "Fotoğraflar yükleme ve işlem sonrası sunuculardan kaldırılır.",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M9 12v5M15 12v5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                color: "#0A84FF",
                title: "3. Taraf Yok",
                desc: "Verileriniz reklamcılara veya analitik şirketlerine satılmaz.",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M4.93 4.93l14.14 14.14" strokeLinecap="round" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <GlassCard key={i} className="px-4 py-3.5 flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white/88">{item.title}</p>
                  <p className="text-[12px] text-white/38 mt-0.5">{item.desc}</p>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        </section>

        <Divider />

        {/* ── SHARING SECTION ──────────────────────────────── */}
        <section className="px-5 pt-6 pb-4">
          <SectionHeading
            label="Paylaşım"
            title={<>Kolayca <GradientText>paylaş</GradientText></>}
            sub="Tüm platformlara tek tıkla"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          >
            <GlassCard className="p-5">
              {/* Phone mockup */}
              <div className="flex justify-center mb-5">
                <div className="relative" style={{ width: 110, height: 175 }}>
                  <div
                    className="w-full h-full rounded-[22px] overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(160deg, rgba(255,55,95,0.4) 0%, rgba(0,0,0,0.6) 45%, rgba(191,90,242,0.3) 100%)" }}
                    />
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </motion.div>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <motion.div
                        className="h-full"
                        style={{ background: "linear-gradient(90deg, #FF375F, #BF5AF2)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: "72%" }}
                        transition={{ delay: 0.8, duration: 2, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Floating share chips */}
                  <motion.div
                    className="absolute -right-10 top-4 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)" }}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
                    </svg>
                    <span className="text-[10px] text-white/70 font-medium">Paylaş</span>
                  </motion.div>

                  <motion.div
                    className="absolute -left-12 bottom-8 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5"
                    style={{ background: "rgba(48,209,88,0.14)", border: "1px solid rgba(48,209,88,0.28)", backdropFilter: "blur(12px)" }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#30D158" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ color: "#30D158" }}>İndir</span>
                  </motion.div>
                </div>
              </div>

              {/* Platform icons row */}
              <div className="flex items-center justify-center gap-4">
                {[
                  { name: "Instagram", color: "#E1306C" },
                  { name: "TikTok", color: "#ffffff" },
                  { name: "WhatsApp", color: "#25D366" },
                  { name: "Twitter/X", color: "#1DA1F2" },
                ].map((platform, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + i * 0.08, duration: 0.35 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                      style={{ background: `${platform.color}18`, border: `1px solid ${platform.color}30` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: platform.color, opacity: 0.8 }} />
                    </div>
                    <span className="text-[9px] text-white/30 font-medium">{platform.name.split("/")[0]}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section className="px-5 pt-8 pb-8 safe-bottom">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <GlassCard className="p-6 text-center" style={{ borderColor: "rgba(255,55,95,0.18)" }}>
              {/* Heart pulse */}
              <div className="flex justify-center mb-4">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute rounded-full"
                    style={{ width: 56, height: 56, border: "1px solid rgba(255,55,95,0.3)" }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="36" height="33" viewBox="0 0 44 40" fill="none">
                      <defs>
                        <linearGradient id="finalHeart" x1="0" y1="0" x2="44" y2="40" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#FF375F" />
                          <stop offset="100%" stopColor="#BF5AF2" />
                        </linearGradient>
                      </defs>
                      <path d="M22 37C22 37 2 24 2 12C2 7 6 3 11 3C15 3 18.5 5.5 20.5 9L22 11.5L23.5 9C25.5 5.5 29 3 33 3C38 3 42 7 42 12C42 24 22 37 22 37Z"
                        fill="url(#finalHeart)" />
                    </svg>
                  </motion.div>
                </div>
              </div>

              <h3
                className="text-[24px] font-bold mb-2 text-white/92 leading-tight"
                style={{ letterSpacing: "-0.025em" }}
              >
                Aşk hikayeni yaz
              </h3>
              <p className="text-[14px] text-white/40 mb-5 leading-relaxed">
                İki fotoğrafla başla — sonucu gören herkes soracak nasıl yaptın diye.
              </p>

              <motion.button
                onClick={handleCta}
                disabled={ctaLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full h-[56px] rounded-2xl text-white text-[17px] font-semibold flex items-center justify-center gap-2.5"
                style={{
                  background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)",
                  boxShadow: "0 4px 32px rgba(255,55,95,0.32)",
                }}
              >
                {ctaLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : (
                  <>
                    Hemen Başla — Ücretsiz
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </motion.button>

              <p className="text-[11px] text-white/22 mt-3">
                Kayıt ol · 1 kredi al · Hikayeni yarat
              </p>
            </GlassCard>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center text-[11px] text-white/20 mt-5"
          >
            CineAmore · Powered by Higgsfield AI
          </motion.p>
        </section>
      </div>
    </div>
  );
}
