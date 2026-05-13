"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { hapticMedium, hapticSuccess, hapticError } from "@/lib/utils/haptic";
import { LogoMark } from "@/components/ui/logo-mark";

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"initial" | "email-sent" | "error">("initial");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (params.get("error")) setStep("error");
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/create");
    });
  }, []);

  const handleGoogle = async () => {
    hapticMedium();
    setLoading("google");
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { hapticError(); setErrorMsg(error.message); setLoading(null); }
  };

  const handleEmail = async () => {
    if (!email.trim()) return;
    hapticMedium();
    setLoading("email");
    setErrorMsg("");
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      hapticError();
      setErrorMsg(error.message);
      setLoading(null);
    } else {
      hapticSuccess();
      setStep("email-sent");
      setLoading(null);
    }
  };

  return (
    <div className="page flex flex-col" style={{ overflowY: "auto" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(255,55,95,0.18) 0%, transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(191,90,242,0.16) 0%, transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(255,55,95,0.18) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-5 safe-top pt-6 pb-10 max-w-sm mx-auto w-full">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pt-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] mb-4"
            style={{ background: "linear-gradient(135deg, rgba(255,55,95,0.2), rgba(191,90,242,0.2))", border: "1px solid rgba(255,255,255,0.12)" }}>
            <LogoMark size={34} color="#FF375F" />
          </div>
          <h1 className="text-[28px] font-bold text-white" style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Aşk hikayeni<br />başlatmak için giriş yap
          </h1>
          <p className="text-[14px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Ücretsiz, 30 saniyede
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "email-sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-strong rounded-[24px] p-8 flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(48,209,88,0.15)" }}
              >
                <svg width="28" height="28" fill="none" stroke="#30D158" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </motion.div>
              <div>
                <h2 className="text-[20px] font-bold text-white">Mail gönderildi</h2>
                <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <span className="text-white/70 font-medium">{email}</span> adresine giriş bağlantısı gönderdik.
                  <br />Spam klasörünü de kontrol et.
                </p>
              </div>
              <button
                onClick={() => setStep("initial")}
                className="text-[13px] cursor-pointer"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Farklı e-posta ile dene
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Trust row */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: (
                      <svg width="16" height="16" fill="none" stroke="#30D158" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                      </svg>
                    ),
                    label: "Güvenli",
                    desc: "TLS şifreleme",
                  },
                  {
                    icon: (
                      <svg width="16" height="16" fill="none" stroke="#FF9F0A" strokeWidth="1.8" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                        <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" />
                        <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" />
                      </svg>
                    ),
                    label: "Görseller Silinir",
                    desc: "İletildikten sonra",
                  },
                  {
                    icon: (
                      <svg width="16" height="16" fill="none" stroke="#BF5AF2" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M20 12V22H4V12" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 7H2v5h20V7z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 22V7" strokeLinecap="round" />
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ),
                    label: "İlk Video Ücretsiz",
                    desc: "Kredi kartı yok",
                  },
                  {
                    icon: (
                      <svg width="16" height="16" fill="none" stroke="#FF375F" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ),
                    label: "Paylaşılmaz",
                    desc: "3. taraf yok",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="rounded-[14px] px-3 py-2.5 flex items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white/75">{item.label}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Google button */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGoogle}
                disabled={!!loading}
                className="w-full h-[54px] rounded-[16px] flex items-center justify-center gap-3
                           font-semibold text-[16px] cursor-pointer disabled:opacity-50 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.95)", color: "#1a1a1a" }}
              >
                {loading === "google" ? (
                  <Spinner dark />
                ) : (
                  <GoogleIcon />
                )}
                Google ile Devam Et
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>veya e-posta ile</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Email input */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-2"
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                  className="w-full h-12 px-4 rounded-[14px] text-[15px] text-white placeholder:text-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEmail}
                  disabled={!email.trim() || !!loading}
                  className="w-full h-12 rounded-[14px] font-semibold text-white text-[15px]
                             cursor-pointer disabled:opacity-35 focus:outline-none"
                  style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}
                >
                  {loading === "email" ? "Gönderiliyor…" : "Giriş Bağlantısı Gönder"}
                </motion.button>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {(errorMsg || step === "error") && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-[13px]"
                    style={{ color: "#FF453A" }}
                  >
                    {errorMsg || "Bir hata oluştu, tekrar dene"}
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="text-center text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
                Giriş yaparak gizlilik politikamızı kabul etmiş olursun.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={dark ? "#1a1a1a" : "white"} strokeWidth="2.5"
      className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
