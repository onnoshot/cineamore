"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "cineamore_admin_pw";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  // Music state
  const [musicStatus, setMusicStatus] = useState<{
    exists: boolean;
    size?: number;
    updatedAt?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const savedPw = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) ?? "" : "";

  useEffect(() => {
    const pw = sessionStorage.getItem(SESSION_KEY);
    if (pw) attemptLogin(pw, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attemptLogin = async (pw: string, silent = false) => {
    if (!pw) return;
    if (!silent) setChecking(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/music", {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.status === 401) {
        if (!silent) setAuthError("Şifre yanlış");
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      const data = await res.json();
      sessionStorage.setItem(SESSION_KEY, pw);
      setAuthed(true);
      setMusicStatus(data);
    } catch {
      if (!silent) setAuthError("Bağlantı hatası");
    } finally {
      setChecking(false);
    }
  };

  const refreshStatus = async () => {
    const pw = sessionStorage.getItem(SESSION_KEY) ?? "";
    const res = await fetch("/api/admin/music", {
      headers: { Authorization: `Bearer ${pw}` },
    });
    const data = await res.json();
    setMusicStatus(data);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const pw = sessionStorage.getItem(SESSION_KEY) ?? "";
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append("music", selectedFile, selectedFile.name);
      const res = await fetch("/api/admin/music", {
        method: "POST",
        headers: { Authorization: `Bearer ${pw}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme hatası");
      setUploadResult({ ok: true, message: `Yüklendi: ${selectedFile.name} (${formatSize(data.size)})` });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refreshStatus();
    } catch (err: unknown) {
      setUploadResult({ ok: false, message: err instanceof Error ? err.message : "Hata" });
    } finally {
      setUploading(false);
    }
  };

  if (!authed) {
    return (
      <div className="page flex items-center justify-center">
        <AmbienceGlow />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="glass-strong rounded-[28px] p-8 w-full max-w-sm mx-5 flex flex-col gap-6"
        >
          <div className="text-center">
            <p className="text-[12px] font-semibold tracking-[0.22em] uppercase mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              CineAmore
            </p>
            <h1 className="text-[26px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Admin Panel
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && attemptLogin(password)}
              className="w-full h-12 rounded-[14px] px-4 text-white text-[15px] outline-none focus:ring-2 focus:ring-white/20"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              autoFocus
            />

            <AnimatePresence>
              {authError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-center"
                  style={{ color: "#FF453A" }}
                >
                  {authError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={() => attemptLogin(password)}
              disabled={!password || checking}
              className="w-full h-12 rounded-[14px] font-semibold text-white text-[15px] transition-opacity disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}
            >
              {checking ? "Kontrol ediliyor…" : "Giriş Yap"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page flex flex-col">
      <AmbienceGlow />

      {/* Header */}
      <div className="relative z-10 safe-top pt-4 px-5 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            CineAmore
          </p>
          <h1 className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
            Admin Panel
          </h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setPassword(""); }}
          className="h-9 px-4 rounded-xl glass text-white/60 text-sm font-medium cursor-pointer"
        >
          Çıkış
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-4">

        {/* Music section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-[24px] p-6 flex flex-col gap-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,55,95,0.15)" }}>
              <MusicIcon />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-white">Fon Müziği</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Tüm videolara eklenen müzik
              </p>
            </div>
          </div>

          {/* Current status */}
          <div className="rounded-[14px] px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {musicStatus?.exists ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: "#30D158", boxShadow: "0 0 6px #30D158aa" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">music.mp3</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {musicStatus.size ? formatSize(musicStatus.size) : ""}
                    {musicStatus.updatedAt ? ` · ${formatDate(musicStatus.updatedAt)}` : ""}
                  </p>
                </div>
                <CheckIcon />
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Henüz müzik yüklenmedi
                </p>
              </>
            )}
          </div>

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative rounded-[16px] flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all duration-200"
            style={{
              border: "2px dashed rgba(255,255,255,0.15)",
              background: selectedFile ? "rgba(255,55,95,0.06)" : "rgba(255,255,255,0.02)",
            }}
          >
            <UploadIcon />
            <p className="text-sm font-medium"
              style={{ color: selectedFile ? "#FF375F" : "rgba(255,255,255,0.55)" }}>
              {selectedFile ? selectedFile.name : "MP3 dosyası seç"}
            </p>
            {selectedFile && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {formatSize(selectedFile.size)}
              </p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,audio/mpeg,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSelectedFile(f);
              }}
            />
          </div>

          {/* Upload result */}
          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[12px] px-4 py-3 text-sm text-center font-medium"
                style={{
                  background: uploadResult.ok ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                  color: uploadResult.ok ? "#30D158" : "#FF453A",
                  border: `1px solid ${uploadResult.ok ? "rgba(48,209,88,0.2)" : "rgba(255,69,58,0.2)"}`,
                }}
              >
                {uploadResult.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full h-[52px] rounded-[16px] font-semibold text-white text-[16px] transition-opacity disabled:opacity-35"
            style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}
          >
            {uploading ? "Yükleniyor…" : "Müziği Kaydet"}
          </button>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-[20px] p-5 flex flex-col gap-2"
        >
          <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
            Nasıl çalışır
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              "MP3 dosyasını seç ve Kaydet'e bas",
              "Yeni bir video oluşturulduğunda ffmpeg müziği otomatik kullanır",
              "Müziği istediğin zaman güncelleyebilirsin",
              "Müzik yoksa video susuz oluşturulur",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(255,55,95,0.6)", marginTop: 5 }} />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ─── Icons ─── */
function MusicIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="#FF375F" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="#30D158" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AmbienceGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,55,95,0.12) 0%, transparent 65%)" }} />
    </div>
  );
}
