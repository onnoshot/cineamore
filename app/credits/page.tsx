"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { hapticMedium, hapticSuccess } from "@/lib/utils/haptic";

const PACKAGES = [
  {
    id: "credit_1",
    credits: 1,
    price: 299,
    pricePerVideo: 299,
    label: "Başlangıç",
    color: "#FF375F",
    popular: false,
    desc: "1 yeni hikaye",
  },
  {
    id: "credit_3",
    credits: 3,
    price: 699,
    pricePerVideo: 233,
    label: "Sevgili",
    color: "#BF5AF2",
    popular: true,
    desc: "3 romantik hikaye",
  },
  {
    id: "credit_5",
    credits: 5,
    price: 999,
    pricePerVideo: 200,
    label: "Sonsuzluk",
    color: "#FF9F0A",
    popular: false,
    desc: "5 sinematik an",
  },
];

export default function CreditsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("credit_3");
  const [showContact, setShowContact] = useState(false);

  const selectedPkg = PACKAGES.find((p) => p.id === selected)!;

  const handlePurchase = () => {
    hapticMedium();
    setShowContact(true);
  };

  const handleWhatsApp = () => {
    hapticSuccess();
    const pkg = selectedPkg;
    const msg = encodeURIComponent(
      `Merhaba! CineAmore'da ${pkg.credits} kredi satın almak istiyorum. Paket: ${pkg.label} - ${pkg.price} TL`
    );
    window.open(`https://wa.me/905000000000?text=${msg}`, "_blank");
  };

  return (
    <div className="page flex flex-col" style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(191,90,242,0.15) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(255,55,95,0.12) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(191,90,242,0.15) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-5 px-5 safe-top pt-5 pb-10 max-w-sm mx-auto w-full">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
              Kredi Satın Al
            </h1>
            <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              İlk videon ücretsizdi — devam et
            </p>
          </div>
        </div>

        {/* Free video used banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[16px] p-4 flex items-start gap-3"
          style={{ background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.25)" }}
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: "rgba(255,159,10,0.2)", color: "#FF9F0A" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Ücretsiz kredin kullanıldı
            </p>
            <p className="text-[12px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
              Yeni hikayeler için kredi satın alabilirsin.
              Her kredi 1 sinematik video üretir.
            </p>
          </div>
        </motion.div>

        {/* What you get */}
        <div className="flex gap-2">
          {[
            { icon: "🎬", label: "4 Sinematik Sahne" },
            { icon: "🎵", label: "Müzikli Video" },
            { icon: "📲", label: "9:16 Dikey" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex-1 rounded-[14px] p-3 flex flex-col items-center gap-1.5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Package cards */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase px-1"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            Paket Seç
          </p>
          {PACKAGES.map((pkg, i) => {
            const isSelected = selected === pkg.id;
            return (
              <motion.button
                key={pkg.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelected(pkg.id); hapticMedium(); }}
                className="relative rounded-[18px] p-4 text-left cursor-pointer focus:outline-none transition-all duration-200"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${pkg.color}20, ${pkg.color}08)`
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isSelected ? pkg.color + "55" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {pkg.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                    style={{ background: pkg.color, color: "white", letterSpacing: "0.06em" }}
                  >
                    EN POPÜLER
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Selection circle */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{
                        borderColor: isSelected ? pkg.color : "rgba(255,255,255,0.2)",
                        background: isSelected ? pkg.color : "transparent",
                      }}
                    >
                      {isSelected && (
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-white">{pkg.credits} Kredi</span>
                        <span
                          className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${pkg.color}20`, color: pkg.color }}
                        >
                          {pkg.label}
                        </span>
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {pkg.desc} · {pkg.pricePerVideo} TL/video
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-[22px] font-bold text-white">{pkg.price}</span>
                    <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}> TL</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Purchase CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePurchase}
          className="w-full h-[54px] rounded-[16px] font-semibold text-white text-[17px] glow-pulse cursor-pointer focus:outline-none"
          style={{ background: `linear-gradient(135deg, ${selectedPkg.color} 0%, #BF5AF2 100%)` }}
        >
          {selectedPkg.price} TL · Satın Al
        </motion.button>

        <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Krediler satın alındıktan sonra hesabına eklenir.
          <br />Kullanılan krediler iade edilmez.
        </p>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowContact(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-full max-w-sm rounded-t-[28px] p-6 safe-bottom pb-8"
              style={{ background: "rgba(20,20,24,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "rgba(255,255,255,0.15)" }} />

              <div className="text-center mb-6">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  Satın Alma
                </p>
                <h3 className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
                  {selectedPkg.credits} Kredi · {selectedPkg.price} TL
                </h3>
                <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Ödeme entegrasyonu aktif edilmemiş.
                  <br />Şimdilik bize yazarak kredi satın alabilirsin.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWhatsApp}
                  className="w-full h-[52px] rounded-[16px] flex items-center justify-center gap-3
                             text-white font-semibold text-[15px] cursor-pointer focus:outline-none"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                >
                  <WhatsAppIcon />
                  WhatsApp ile Satın Al
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const pkg = selectedPkg;
                    const subject = encodeURIComponent(`CineAmore ${pkg.credits} Kredi Satın Alma`);
                    const body = encodeURIComponent(
                      `Merhaba,\n\nCineAmore'da ${pkg.credits} kredi (${pkg.label} paketi) satın almak istiyorum.\n\nToplam: ${pkg.price} TL\n\nHesap bilgilerimi yazabilir misiniz?`
                    );
                    window.open(`mailto:destek@cineamore.com?subject=${subject}&body=${body}`, "_blank");
                    hapticMedium();
                  }}
                  className="w-full h-[52px] rounded-[16px] flex items-center justify-center gap-3
                             font-semibold text-[15px] cursor-pointer focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  E-posta ile Yaz
                </motion.button>

                <button
                  onClick={() => setShowContact(false)}
                  className="text-center text-[13px] cursor-pointer mt-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
