"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "@/lib/utils/haptic";

const STORAGE_KEY = "cineamore_user";

const TRUST_ITEMS = [
  {
    delay: 0,
    color: "#30D158",
    title: "Tamamen Ücretsiz",
    desc: "Kredi kartı gerekmez",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
        <path d="M15 9H9.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 1 0 5H9" strokeLinecap="round" />
        <path d="M12 6v2M12 16v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    delay: 0.08,
    color: "#FF9F0A",
    title: "Görseller Silinir",
    desc: "Oluşturulur, iletilir, silinir",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 11v6M14 11v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    delay: 0.16,
    color: "#BF5AF2",
    title: "Şifreli İletim",
    desc: "Uçtan uca TLS şifreleme",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    delay: 0.24,
    color: "#FF375F",
    title: "Paylaşılmaz",
    desc: "Veriler üçüncü taraflara iletilmez",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) router.replace("/create");
  }, [router]);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !city.trim() || !birthYear) return;
    hapticMedium();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), city: city.trim(), birthYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kayıt hatası");

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fullName: fullName.trim(), email: email.trim() }));
      hapticSuccess();
      router.push("/create");
    } catch (err: unknown) {
      hapticError();
      setError(err instanceof Error ? err.message : "Bir sorun çıktı, tekrar dene");
      setLoading(false);
    }
  };

  const allFilled = fullName.trim() && email.trim() && city.trim() && birthYear;

  return (
    <div className="page flex flex-col" style={{ overflowY: "auto", overflowX: "hidden" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,55,95,0.13) 0%, transparent 65%)",
              "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(191,90,242,0.13) 0%, transparent 65%)",
              "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,55,95,0.13) 0%, transparent 65%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-5 safe-top pt-5 pb-10 max-w-sm mx-auto w-full">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pt-2"
        >
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            CineAmore
          </p>
          <h1 className="text-[28px] font-bold text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>
            Hikayeni başlatmak<br />için kaydol
          </h1>
          <p className="text-[14px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Tek seferlik, ücretsiz ve 30 saniyede
          </p>
        </motion.div>

        {/* Trust cards */}
        <div className="grid grid-cols-2 gap-2">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + item.delay, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-[16px] p-3 flex flex-col gap-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Icon with animated glow */}
              <motion.div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: `${item.color}18`, color: item.color }}
                animate={{ boxShadow: [`0 0 0px ${item.color}00`, `0 0 12px ${item.color}40`, `0 0 0px ${item.color}00`] }}
                transition={{ delay: 0.5 + item.delay, duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {item.icon}
              </motion.div>
              <div>
                <p className="text-[13px] font-semibold text-white/85 leading-tight">{item.title}</p>
                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <FormField
            label="Ad Soyad"
            placeholder="Adın ve soyadın"
            value={fullName}
            onChange={setFullName}
            type="text"
            autoComplete="name"
          />
          <FormField
            label="E-posta"
            placeholder="ornek@mail.com"
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Şehir"
              placeholder="İstanbul"
              value={city}
              onChange={setCity}
              type="text"
              autoComplete="address-level2"
            />
            <FormField
              label="Doğum Yılı"
              placeholder="1990"
              value={birthYear}
              onChange={(v) => {
                if (/^\d{0,4}$/.test(v)) setBirthYear(v);
              }}
              type="numeric"
              autoComplete="bday-year"
            />
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-center"
              style={{ color: "#FF453A", marginTop: -8 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!allFilled || loading}
            className="w-full h-[54px] rounded-[16px] font-semibold text-white text-[17px] glow-pulse
                       disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
            style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}
          >
            {loading ? "Kaydediliyor…" : "Kaydol ve Başla"}
          </motion.button>

          <p className="text-center text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
            Kaydolarak gizlilik politikamızı kabul etmiş olursun.
            <br />Verilerine hiçbir zaman üçüncü taraf erişemez.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FormField({
  label, placeholder, value, onChange, type, autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold px-1" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 2px rgba(255,55,95,0.4)"
            : "0 0 0 0px rgba(255,55,95,0)",
        }}
        transition={{ duration: 0.2 }}
        className="rounded-[14px] overflow-hidden"
      >
        <input
          type={type === "numeric" ? "text" : type}
          inputMode={type === "numeric" ? "numeric" : undefined}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); hapticLight(); }}
          onBlur={() => setFocused(false)}
          className="w-full h-12 px-4 text-[15px] text-white placeholder:text-white/25 outline-none"
          style={{
            background: focused ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${focused ? "rgba(255,55,95,0.35)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: 14,
            transition: "background 0.2s, border-color 0.2s",
          }}
        />
      </motion.div>
    </div>
  );
}
