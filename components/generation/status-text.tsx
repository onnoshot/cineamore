"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Yüzler analiz ediliyor…",
  "Sahneler oluşturuluyor…",
  "Görsel detaylar işleniyor…",
  "Sinematik efektler ekleniyor…",
  "Videolar birleştiriliyor…",
  "Son rötuşlar yapılıyor…",
  "Az kaldı…",
];

export function StatusText({ phase }: { phase: number }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIdx((p) => (p + 1) % MESSAGES.length), 3000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35 }}
        className="text-center text-[15px] font-medium"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {MESSAGES[idx]}
      </motion.p>
    </AnimatePresence>
  );
}
