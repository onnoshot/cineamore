"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES_BY_PHASE = [
  ["Karakterleri tanıyoruz…", "Yüzleri hafızaya alıyoruz…"],
  ["Çöl manzarası boyanıyor…", "Kumlar savrulurken…", "Uzak dağlar beliriyor…"],
  ["Büyülü dokunuş hazırlanıyor…", "Cennet yeşeriyor…", "Çiçekler filizleniyor…"],
  ["Aşk dolu bir bakış…", "Gözler birbirine kilitlendi…"],
  ["Güller açılıyor…", "Son sahne büyüleniyor…", "Finali hazırlıyoruz…"],
  ["Müzik bindiriliyor…", "Son dokunuşlar yapılıyor…", "Masterpiece hazır neredeyse…"],
];

interface StatusTextProps {
  phase: number;
}

export function StatusText({ phase }: StatusTextProps) {
  const messages = MESSAGES_BY_PHASE[Math.min(phase, MESSAGES_BY_PHASE.length - 1)];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={`${phase}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="text-[15px] text-white/60 text-center"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
