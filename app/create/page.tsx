"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaceUploader } from "@/components/upload/face-uploader";
import { Button } from "@/components/ui/button";
import { useGenerationStore } from "@/store/generation-store";
import { hapticMedium, hapticError } from "@/lib/utils/haptic";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/use-lang";

export default function CreatePage() {
  const router = useRouter();
  const { setRefs, setJobId, setPhase, setCity, setEmail, reset } = useGenerationStore();
  const supabase = createClient();
  const { t } = useLang();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth"); return; }
      setUserEmail(user.email ?? null);
    });
  }, [router]);

  const [manBlob, setManBlob] = useState<Blob | null>(null);
  const [womanBlob, setWomanBlob] = useState<Blob | null>(null);
  const [manPreview, setManPreview] = useState<string>();
  const [womanPreview, setWomanPreview] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const bothReady = !!manBlob && !!womanBlob;

  const handleStart = async () => {
    if (!manBlob || !womanBlob) return;
    hapticMedium();
    setUploading(true);
    setError(undefined);
    reset();

    try {
      const form = new FormData();
      form.append("man", manBlob, "man.webp");
      form.append("woman", womanBlob, "woman.webp");
      if (userEmail) form.append("email", userEmail);

      const res = await fetch("/api/prepare", { method: "POST", body: form });
      const data = await res.json();

      if (res.status === 402 && data.error === "credits_exhausted") {
        router.push("/credits");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Hazırlık hatası");

      setJobId(data.jobId);
      setRefs(data.manUrl, data.womanUrl);
      setCity(data.city ?? null);
      setEmail(userEmail);
      setPhase("generating");

      router.push("/create/generating");
    } catch (err: unknown) {
      hapticError();
      setError(err instanceof Error ? err.message : "Bir sorun çıktı, tekrar deneyelim.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,55,95,0.07) 0%, transparent 100%)" }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex items-center gap-3 safe-top pt-4 pb-6"
        >
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full glass flex items-center justify-center
                       cursor-pointer hover:bg-white/[0.08] transition-colors duration-200 focus:outline-none"
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-white/95" style={{ letterSpacing: "-0.01em" }}>
              {t.create.title}
            </h1>
            <p className="text-sm text-white/40">{t.create.subtitle}</p>
          </div>
        </motion.div>

        {/* Upload grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-2 gap-4"
        >
          <FaceUploader
            label={t.create.male}
            accentColor="#0A84FF"
            preview={manPreview}
            onUpload={(blob, preview) => { setManBlob(blob); setManPreview(preview); }}
          />
          <FaceUploader
            label={t.create.female}
            accentColor="#FF375F"
            preview={womanPreview}
            onUpload={(blob, preview) => { setWomanBlob(blob); setWomanPreview(preview); }}
          />
        </motion.div>

        {/* Photo tips */}
        <PhotoTips label={t.create.tipsLabel} items={t.create.tips} />

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 text-center mt-3"
          >
            {error}
          </motion.p>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="mt-auto safe-bottom py-5"
        >
          <Button
            size="xl"
            fullWidth
            disabled={!bothReady}
            loading={uploading}
            onClick={handleStart}
            className={bothReady ? "glow-pulse" : ""}
          >
            {uploading ? t.create.startBtnLoading : t.create.startBtn}
          </Button>

          {!bothReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-4 mt-4"
            >
              <UploadIndicator done={!!manBlob} label={t.create.male} />
              <div className="w-8 h-px bg-white/10" />
              <UploadIndicator done={!!womanBlob} label={t.create.female} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

const TIP_ICONS = [
  { icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M17 3l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ), color: "#FF375F" },
  { icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  ), color: "#FF9F0A" },
  { icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  ), color: "#BF5AF2" },
  { icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  ), color: "#30D158" },
];

function PhotoTips({ label, items }: { label: string; items: { title: string; desc: string }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-4"
    >
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-2.5 px-1"
        style={{ color: "rgba(255,255,255,0.25)" }}>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
            className="rounded-[14px] px-3 py-3 flex items-start gap-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${TIP_ICONS[i].color}18`, color: TIP_ICONS[i].color }}
            >
              {TIP_ICONS[i].icon}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/80 leading-tight">{tip.title}</p>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {tip.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function UploadIndicator({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${done ? "bg-green-400" : "bg-white/15"}`} />
      <span className={`text-xs transition-colors duration-300 ${done ? "text-white/60" : "text-white/25"}`}>
        {label}
      </span>
    </div>
  );
}
