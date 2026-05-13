"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet } from "@/components/ui/sheet";
import { ImageCropper } from "@/components/upload/image-cropper";
import { hapticLight, hapticSuccess, hapticError } from "@/lib/utils/haptic";
import { cn } from "@/lib/utils/cn";

interface FaceUploaderProps {
  label: string;
  sublabel?: string;
  onUpload: (blob: Blob, preview: string) => void;
  preview?: string;
  error?: string;
  accentColor?: string;
}

export function FaceUploader({ label, sublabel, onUpload, preview, error, accentColor = "rgba(255,255,255,0.7)" }: FaceUploaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSheetOpen(false);
    hapticLight();
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  };

  const handleCropConfirm = (blob: Blob, previewUrl: string) => {
    setCropSrc(null);
    hapticSuccess();
    onUpload(blob, previewUrl);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    hapticError();
  };

  return (
    <>
      {/* Crop overlay */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          label={label}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => { hapticLight(); setSheetOpen(true); }}
        className={cn(
          "relative w-full aspect-[3/4] rounded-[20px] overflow-hidden cursor-pointer",
          "flex flex-col items-center justify-center gap-3",
          "border-2 border-dashed transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          error ? "border-red-500/40" : ""
        )}
        style={!preview && !error ? { borderColor: `${accentColor}55` } : undefined}
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
              <img src={preview} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="glass px-3 py-1 rounded-full text-xs text-white/80 font-medium flex items-center gap-1.5">
                  <CheckIcon size={10} />
                  {label}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="glass w-8 h-8 rounded-full flex items-center justify-center">
                  <EditIcon size={13} />
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
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${accentColor}22`, border: `1.5px solid ${accentColor}55` }}
              >
                <PersonIcon size={28} color={accentColor} />
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Fotoğraf Seç">
        <div className="flex flex-col gap-3 mt-2">
          <SheetOption
            icon={<GalleryIcon size={22} />}
            label="Galeriden Seç"
            onClick={() => fileInputRef.current?.click()}
          />
          <SheetOption
            icon={<CameraIcon size={22} />}
            label="Kameradan Çek"
            onClick={() => cameraInputRef.current?.click()}
          />
          <div className="pt-2">
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full h-12 rounded-[14px] glass text-white/60 text-[15px] cursor-pointer
                         hover:text-white/80 transition-colors duration-200 focus:outline-none"
            >
              İptal
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function SheetOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { hapticLight(); onClick(); }}
      className="w-full h-14 rounded-[14px] glass-elevated flex items-center gap-4 px-5 text-left
                 cursor-pointer hover:bg-white/[0.06] transition-colors duration-200 focus:outline-none"
    >
      <span className="text-white/70">{icon}</span>
      <span className="text-white/90 font-medium text-[15px]">{label}</span>
    </motion.button>
  );
}

/* ─── Icons ─── */
function PersonIcon({ size, color = "white" }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function EditIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function GalleryIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function CameraIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
