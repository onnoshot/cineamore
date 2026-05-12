"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaceUploader } from "@/components/upload/face-uploader";
import { Button } from "@/components/ui/button";
import { useGenerationStore } from "@/store/generation-store";
import { hapticMedium, hapticError } from "@/lib/utils/haptic";

export default function CreatePage() {
  const router = useRouter();
  const { setRefs, setJobId, setPhase, reset } = useGenerationStore();

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

      const res = await fetch("/api/prepare", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Hazırlık hatası");

      setJobId(data.jobId);
      setRefs(data.manUrl, data.womanUrl);
      setPhase("generating");
      router.push("/create/generating");
    } catch (err: unknown) {
      hapticError();
      setError(err instanceof Error ? err.message : "Bir sorun çıktı, tekrar deneyelim.");
      setUploading(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,55,95,0.07) 0%, transparent 100%)" }}
      />

      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full px-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex items-center gap-3 pt-12 pb-6"
        >
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass flex items-center justify-center
                       cursor-pointer hover:bg-white/[0.08] transition-colors duration-200 focus:outline-none"
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-white/95" style={{ letterSpacing: "-0.01em" }}>
              Karakterleri Seç
            </h1>
            <p className="text-sm text-white/40">Net yüz fotoğrafı yükle</p>
          </div>
        </motion.div>

        {/* Upload grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-2 gap-4"
          style={{ maxHeight: "55vh" }}
        >
          <FaceUploader
            label="Sen"
            sublabel="Erkek karakter"
            preview={manPreview}
            onUpload={(blob, preview) => { setManBlob(blob); setManPreview(preview); }}
          />
          <FaceUploader
            label="O"
            sublabel="Kadın karakter"
            preview={womanPreview}
            onUpload={(blob, preview) => { setWomanBlob(blob); setWomanPreview(preview); }}
          />
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 glass rounded-[14px] px-4 py-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
            <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm text-white/55 leading-relaxed">
            En iyi sonuç için yüz açıkça görünsün, ön cephe, iyi ışık.
          </p>
        </motion.div>

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
          className="mt-auto py-6"
        >
          <Button
            size="xl"
            fullWidth
            disabled={!bothReady}
            loading={uploading}
            onClick={handleStart}
            className={bothReady ? "glow-pulse" : ""}
          >
            {uploading ? "Yükleniyor…" : "Hikayeyi Başlat"}
          </Button>

          {!bothReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-4 mt-4"
            >
              <UploadIndicator done={!!manBlob} label="Sen" />
              <div className="w-8 h-px bg-white/10" />
              <UploadIndicator done={!!womanBlob} label="O" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
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
