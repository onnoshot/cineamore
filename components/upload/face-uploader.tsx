"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/utils/haptic";
import { resizeImageToBlob } from "@/lib/utils/image-resize";
import { cn } from "@/lib/utils/cn";

interface FaceUploaderProps {
  label: string;
  sublabel?: string;
  onUpload: (blob: Blob, preview: string) => void;
  preview?: string;
  error?: string;
}

export function FaceUploader({ label, sublabel, onUpload, preview, error }: FaceUploaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setSheetOpen(false);
    hapticLight();
    try {
      const blob = await resizeImageToBlob(file, 1024);
      const objectUrl = URL.createObjectURL(blob);
      hapticSuccess();
      onUpload(blob, objectUrl);
    } catch {
      hapticError();
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => { hapticLight(); setSheetOpen(true); }}
        className={cn(
          "relative w-full aspect-[3/4] rounded-[20px] overflow-hidden",
          "flex flex-col items-center justify-center gap-3",
          "border-2 border-dashed transition-colors",
          preview ? "border-transparent" : "border-white/15",
          error ? "border-red-500/40" : ""
        )}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={label}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Done badge */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="glass px-3 py-1 rounded-full text-xs text-white/80 font-medium">
                  ✓ {label}
                </span>
              </div>
              {/* Tap to change */}
              <div className="absolute top-3 right-3">
                <span className="glass w-8 h-8 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 glass w-full h-full rounded-[20px] justify-center"
            >
              {/* Avatar placeholder */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center"
              >
                <svg width="28" height="28" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </motion.div>
              <div className="text-center">
                <p className="text-white/90 font-semibold text-[15px]">{label}</p>
                {sublabel && <p className="text-white/40 text-xs mt-0.5">{sublabel}</p>}
              </div>
              <span className="glass px-3 py-1.5 rounded-full text-xs text-white/60">
                Fotoğraf seç
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 mt-2 text-center"
        >
          {error}
        </motion.p>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Bottom sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Fotoğraf Seç">
        <div className="flex flex-col gap-3 mt-2">
          <SheetOption
            icon="🖼️"
            label="Galeriden Seç"
            onClick={() => { fileInputRef.current?.click(); }}
          />
          <SheetOption
            icon="📸"
            label="Kameradan Çek"
            onClick={() => { cameraInputRef.current?.click(); }}
          />
          <div className="pt-2">
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full h-12 rounded-[14px] glass text-white/60 text-[15px]"
            >
              İptal
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function SheetOption({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { hapticLight(); onClick(); }}
      className="w-full h-14 rounded-[14px] glass-elevated flex items-center gap-4 px-5 text-left"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-white/90 font-medium text-[15px]">{label}</span>
    </motion.button>
  );
}
