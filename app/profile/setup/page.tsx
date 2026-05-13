"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "@/lib/utils/haptic";
import { LogoMark } from "@/components/ui/logo-mark";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth"); return; }
      setUserEmail(user.email ?? "");
      // Pre-fill name from Google provider
      const meta = user.user_metadata;
      if (meta?.full_name) setFullName(meta.full_name);
      else if (meta?.name) setFullName(meta.name);
      // Check if profile already complete
      supabase.from("profiles").select("full_name, city, birth_year").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.full_name && data?.city && data?.birth_year) router.replace("/create");
        });
    });
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || !city.trim() || !birthYear) return;
    hapticMedium();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        city: city.trim(),
        birth_year: parseInt(birthYear),
      });

    if (upsertErr) {
      hapticError();
      setError(upsertErr.message);
      setLoading(false);
      return;
    }

    hapticSuccess();
    router.push("/create");
  };

  const allFilled = fullName.trim() && city.trim() && birthYear;

  return (
    <div className="page flex flex-col" style={{ overflowY: "auto" }}>
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(48,209,88,0.12) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(10,132,255,0.12) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(48,209,88,0.12) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-5 px-5 safe-top pt-6 pb-10 max-w-sm mx-auto w-full">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[20px] mb-4"
            style={{ background: "linear-gradient(135deg, rgba(255,55,95,0.2), rgba(191,90,242,0.2))", border: "1px solid rgba(255,255,255,0.12)" }}>
            <LogoMark size={30} color="#FF375F" />
          </div>
          <h1 className="text-[26px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
            Profilini Tamamla
          </h1>
          {userEmail && (
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {userEmail}
            </p>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="glass-strong rounded-[24px] p-5 flex flex-col gap-4"
        >
          <Field
            label="Ad Soyad"
            placeholder="Adın ve soyadın"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Şehir"
              placeholder="İstanbul"
              value={city}
              onChange={setCity}
              autoComplete="address-level2"
            />
            <Field
              label="Doğum Yılı"
              placeholder="1990"
              value={birthYear}
              onChange={(v) => { if (/^\d{0,4}$/.test(v)) setBirthYear(v); }}
              inputMode="numeric"
              autoComplete="bday-year"
            />
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-[13px]" style={{ color: "#FF453A" }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!allFilled || loading}
          className="w-full h-[54px] rounded-[16px] font-semibold text-white text-[17px]
                     glow-pulse disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          style={{ background: "linear-gradient(135deg, #30D158 0%, #0A84FF 100%)" }}
        >
          {loading ? "Kaydediliyor…" : "Devam Et"}
        </motion.button>

        <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Bu bilgiler sadece deneyimini kişiselleştirmek için kullanılır.
        </p>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, inputMode, autoComplete }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold px-1" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</label>
      <motion.div
        animate={{ boxShadow: focused ? "0 0 0 2px rgba(48,209,88,0.35)" : "0 0 0 0px transparent" }}
        transition={{ duration: 0.2 }}
        className="rounded-[13px] overflow-hidden"
      >
        <input
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); hapticLight(); }}
          onBlur={() => setFocused(false)}
          className="w-full h-12 px-4 text-[15px] text-white placeholder:text-white/25 outline-none"
          style={{
            background: focused ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${focused ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: 13,
            transition: "background 0.2s, border-color 0.2s",
          }}
        />
      </motion.div>
    </div>
  );
}
