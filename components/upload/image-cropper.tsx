"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { getCroppedBlob, type CroppedArea } from "@/lib/utils/crop-image";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptic";

interface ImageCropperProps {
  imageSrc: string;
  label: string;
  onConfirm: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, label, onConfirm, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: CroppedArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    hapticLight();
    setConfirming(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, 1024);
      const previewUrl = URL.createObjectURL(blob);
      hapticSuccess();
      onConfirm(blob, previewUrl);
    } catch {
      setConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "#000" }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="safe-top pt-3 px-5 pb-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={onCancel}
            className="text-sm font-medium cursor-pointer"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            İptal
          </button>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-white">{label}</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Yüzü çerçevelenin içine al
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="text-sm font-semibold cursor-pointer disabled:opacity-40"
            style={{ color: "#FF375F" }}
          >
            {confirming ? "İşleniyor…" : "Seç"}
          </button>
        </motion.div>

        {/* Crop area */}
        <div className="flex-1 relative">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
            showGrid={false}
            style={{
              containerStyle: { background: "#000" },
              cropAreaStyle: {
                border: "2px solid rgba(255,55,95,0.8)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
              },
            }}
          />
        </div>

        {/* Zoom slider + hint */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="safe-bottom px-8 pt-5 pb-5 flex flex-col items-center gap-4 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}
        >
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Büyütmek için iki parmağını aç veya kaydırıcıyı kullan
          </p>
          <div className="flex items-center gap-3 w-full">
            <ZoomOutIcon />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #FF375F ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.15) ${((zoom - 1) / 2) * 100}%)`,
              }}
            />
            <ZoomInIcon />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M8 11h6" />
    </svg>
  );
}
function ZoomInIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}
