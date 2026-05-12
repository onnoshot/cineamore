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
      setError(
        err instanceof Error
          ? err.message
          : "Bir sorun çıktı, tekrar deneyelim."
      );
      setUploading(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Subtle gradient top */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,55,95,0.08) 0%, transparent 100%)",
        }}
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
            className="w-9 h-9 rounded-full glass flex items-center justify-center"
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-white/95" style={{ letterSpacing: "-0.01em" }}>
              Karakterleri Seç
            </h1>
            <p className="text-sm text-white/45">Her biri için net bir yüz fotoğrafı yükle</p>
          </div>
        </motion.div>

        {/* Upload grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-2 gap-4 flex-1"
          style={{ maxHeight: "60vh" }}
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 glass rounded-[14px] p-4"
        >
          <div className="flex gap-3 items-start">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <p className="text-sm text-white/70 leading-relaxed">
                En iyi sonuç için yüz açıkça görünsün, ön cephe çekim, iyi aydınlatma.
              </p>
              <a href="#privacy" className="text-xs text-white/35 mt-1 block underline underline-offset-2">
                Fotoğraflar 1 saat içinde silinir
              </a>
            </div>
          </div>
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
          className="py-6"
        >
          <Button
            size="xl"
            fullWidth
            disabled={!bothReady}
            loading={uploading}
            onClick={handleStart}
          >
            {uploading ? "Yükleniyor…" : "Hikayeyi Başlat 🎬"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
