"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "cineamore_admin_pw";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface MusicStatus { exists: boolean; size?: number; updatedAt?: string }
interface User { id: string; full_name: string; email: string; city: string; birth_year: number; created_at: string }
interface Stats {
  total: number; thisWeek: number; avgAge: number;
  cities: { city: string; count: number }[];
  ageGroups: { label: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}
interface VideoItem { jobId: string; url: string; size: number | null; createdAt: string | null }

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<"music" | "users" | "videos">("music");

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
      const res = await fetch("/api/admin/music", { headers: { Authorization: `Bearer ${pw}` } });
      if (res.status === 401) {
        if (!silent) setAuthError("Şifre yanlış");
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, pw);
      setAuthed(true);
    } catch { if (!silent) setAuthError("Bağlantı hatası"); }
    finally { setChecking(false); }
  };

  if (!authed) return <LoginScreen password={password} setPassword={setPassword} error={authError} checking={checking} onLogin={() => attemptLogin(password)} />;

  return (
    <div className="page flex flex-col">
      <AmbienceGlow />

      {/* Header */}
      <div className="relative z-10 safe-top pt-4 px-5 pb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>CineAmore</p>
          <h1 className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.01em" }}>Admin Panel</h1>
        </div>
        <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setPassword(""); }}
          className="h-9 px-4 rounded-xl glass text-white/60 text-sm font-medium cursor-pointer">Çıkış</button>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex gap-1 px-5 pb-3 flex-shrink-0">
        {(["music", "users", "videos"] as const).map((t) => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className="h-9 px-5 rounded-full text-sm font-medium cursor-pointer transition-colors duration-200"
            style={{
              background: tab === t ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === t ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              border: tab === t ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
            }}
          >
            {t === "music" ? "Müzik" : t === "users" ? "Kullanıcılar" : "Videolar"}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "music"
            ? <MusicTab key="music" />
            : tab === "users"
            ? <UsersTab key="users" />
            : <VideosTab key="videos" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Login
───────────────────────────────────────────── */
function LoginScreen({ password, setPassword, error, checking, onLogin }: {
  password: string; setPassword: (v: string) => void;
  error: string; checking: boolean; onLogin: () => void;
}) {
  return (
    <div className="page flex items-center justify-center">
      <AmbienceGlow />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="glass-strong rounded-[28px] p-8 w-full max-w-sm mx-5 flex flex-col gap-6">
        <div className="text-center">
          <p className="text-[12px] font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>CineAmore</p>
          <h1 className="text-[26px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>Admin Panel</h1>
        </div>
        <div className="flex flex-col gap-3">
          <input type="password" placeholder="Şifre" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onLogin()}
            className="w-full h-12 rounded-[14px] px-4 text-white text-[15px] outline-none focus:ring-2 focus:ring-white/20"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} autoFocus />
          <AnimatePresence>
            {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm text-center" style={{ color: "#FF453A" }}>{error}</motion.p>}
          </AnimatePresence>
          <button onClick={onLogin} disabled={!password || checking}
            className="w-full h-12 rounded-[14px] font-semibold text-white text-[15px] transition-opacity disabled:opacity-40 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}>
            {checking ? "Kontrol ediliyor…" : "Giriş Yap"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Music Tab
───────────────────────────────────────────── */
function MusicTab() {
  const [musicStatus, setMusicStatus] = useState<MusicStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const pw = () => sessionStorage.getItem(SESSION_KEY) ?? "";

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/admin/music", { headers: { Authorization: `Bearer ${pw()}` } });
    const data = await res.json();
    setMusicStatus(data);
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); setUploadResult(null);
    try {
      const form = new FormData();
      form.append("music", selectedFile, selectedFile.name);
      const res = await fetch("/api/admin/music", { method: "POST", headers: { Authorization: `Bearer ${pw()}` }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme hatası");
      setUploadResult({ ok: true, message: `Yüklendi: ${selectedFile.name} (${formatSize(data.size)})` });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refreshStatus();
    } catch (err: unknown) {
      setUploadResult({ ok: false, message: err instanceof Error ? err.message : "Hata" });
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setConfirmDelete(false); setUploadResult(null);
    try {
      const res = await fetch("/api/admin/music", { method: "DELETE", headers: { Authorization: `Bearer ${pw()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Silme hatası");
      setUploadResult({ ok: true, message: "Müzik silindi" });
      await refreshStatus();
    } catch (err: unknown) {
      setUploadResult({ ok: false, message: err instanceof Error ? err.message : "Hata" });
    } finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="px-5 pb-10 flex flex-col gap-4">
      <div className="glass-strong rounded-[24px] p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,55,95,0.15)" }}>
            <MusicIcon />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-white">Fon Müziği</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Tüm videolara eklenen müzik</p>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-[14px] px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {musicStatus?.exists ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#30D158", boxShadow: "0 0 6px #30D158aa" }} />
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
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Henüz müzik yüklenmedi</p>
            </>
          )}
        </div>

        <AnimatePresence>
          {musicStatus?.exists && !confirmDelete && (
            <motion.button initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(true)}
              className="w-full h-11 rounded-[14px] text-sm font-medium cursor-pointer"
              style={{ background: "rgba(255,69,58,0.10)", border: "1px solid rgba(255,69,58,0.20)", color: "#FF453A" }}>
              Müziği Sil
            </motion.button>
          )}
          {confirmDelete && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-[14px] p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,69,58,0.10)", border: "1px solid rgba(255,69,58,0.2)" }}>
              <p className="text-sm text-center font-medium" style={{ color: "#FF453A" }}>Müzik tüm veriden silinecek. Emin misin?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-10 rounded-[12px] text-sm font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>Vazgeç</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 h-10 rounded-[12px] text-sm font-semibold cursor-pointer disabled:opacity-40"
                  style={{ background: "#FF453A", color: "white" }}>
                  {deleting ? "Siliniyor…" : "Evet, Sil"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File picker */}
        <div onClick={() => fileRef.current?.click()}
          className="relative rounded-[16px] flex flex-col items-center justify-center gap-2 py-8 cursor-pointer"
          style={{ border: "2px dashed rgba(255,255,255,0.15)", background: selectedFile ? "rgba(255,55,95,0.06)" : "rgba(255,255,255,0.02)" }}>
          <UploadIcon />
          <p className="text-sm font-medium" style={{ color: selectedFile ? "#FF375F" : "rgba(255,255,255,0.55)" }}>
            {selectedFile ? selectedFile.name : "MP3 dosyası seç"}
          </p>
          {selectedFile && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{formatSize(selectedFile.size)}</p>}
          <input ref={fileRef} type="file" accept=".mp3,audio/mpeg,audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
        </div>

        <AnimatePresence>
          {uploadResult && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-[12px] px-4 py-3 text-sm text-center font-medium"
              style={{
                background: uploadResult.ok ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                color: uploadResult.ok ? "#30D158" : "#FF453A",
                border: `1px solid ${uploadResult.ok ? "rgba(48,209,88,0.2)" : "rgba(255,69,58,0.2)"}`,
              }}>{uploadResult.message}</motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleUpload} disabled={!selectedFile || uploading}
          className="w-full h-[52px] rounded-[16px] font-semibold text-white text-[16px] disabled:opacity-35 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #FF375F 0%, #BF5AF2 100%)" }}>
          {uploading ? "Yükleniyor…" : "Müziği Kaydet"}
        </button>
      </div>

      <div className="glass rounded-[20px] p-5 flex flex-col gap-2">
        <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Nasıl çalışır</p>
        <ul className="flex flex-col gap-1.5">
          {["MP3 dosyasını seç ve Kaydet'e bas", "Yeni video oluşturulduğunda ffmpeg otomatik kullanır", "İstediğin zaman güncelleyebilirsin", "Müzik yoksa video susuz oluşturulur"].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,55,95,0.6)", marginTop: 5 }} />{t}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Users Tab
───────────────────────────────────────────── */
function UsersTab() {
  const [data, setData] = useState<{ users: User[]; stats: Stats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pw = () => sessionStorage.getItem(SESSION_KEY) ?? "";

  useEffect(() => {
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${pw()}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Veri alınamadı"); setLoading(false); });
  }, []);

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-24">
      <motion.div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70"
        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
    </motion.div>
  );

  if (error) return <div className="px-5 py-10 text-center text-white/40 text-sm">{error}</div>;
  if (!data) return null;

  const { users, stats } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="px-5 pb-10 flex flex-col gap-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Toplam Üye", value: stats.total, color: "#FF375F", icon: <UsersIcon /> },
          { label: "Bu Hafta", value: `+${stats.thisWeek}`, color: "#30D158", icon: <TrendIcon /> },
          { label: "Ort. Yaş", value: stats.avgAge || "—", color: "#FF9F0A", icon: <AgeIcon /> },
          { label: "Şehir", value: stats.cities[0]?.city ?? "—", color: "#BF5AF2", icon: <CityIcon /> },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-strong rounded-[18px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <p className="text-[22px] font-bold text-white leading-none" style={{ letterSpacing: "-0.02em" }}>{s.value}</p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily trend */}
      {stats.dailyTrend.some((d) => d.count > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-strong rounded-[20px] p-5">
          <p className="text-[13px] font-semibold mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Son 7 Gün</p>
          <TrendChart data={stats.dailyTrend} color="#FF375F" />
        </motion.div>
      )}

      {/* City distribution */}
      {stats.cities.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-strong rounded-[20px] p-5">
          <p className="text-[13px] font-semibold mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Şehir Dağılımı</p>
          <CityChart data={stats.cities} />
        </motion.div>
      )}

      {/* Age groups */}
      {stats.ageGroups.some((g) => g.count > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-strong rounded-[20px] p-5">
          <p className="text-[13px] font-semibold mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Yaş Grupları</p>
          <AgeChart data={stats.ageGroups} />
        </motion.div>
      )}

      {/* User list */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-strong rounded-[20px] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Kayıtlı Kullanıcılar</p>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>{users.length} kayıt</p>
        </div>
        {users.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Henüz kayıt yok</p>
        ) : (
          <div className="flex flex-col">
            {users.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                className="px-5 py-3.5 flex items-start gap-3"
                style={{ borderBottom: i < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: `hsl(${(u.full_name.charCodeAt(0) * 37) % 360}, 60%, 25%)`, color: `hsl(${(u.full_name.charCodeAt(0) * 37) % 360}, 80%, 70%)` }}>
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white/85 truncate">{u.full_name}</p>
                  <p className="text-[12px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{u.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{u.city}</span>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>·</span>
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{u.birth_year}</span>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>·</span>
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{formatDate(u.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Charts
───────────────────────────────────────────── */
function TrendChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 280; const H = 72; const pad = 4;
  const step = (W - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * step,
    y: H - pad - ((d.count / max) * (H - pad * 2)),
    count: d.count,
    date: d.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={areaD} fill="url(#tg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} />
        <motion.path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }} />
        {points.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill={color}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.05 }} />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            {new Date(d.date).getDate()}
          </span>
        ))}
      </div>
    </div>
  );
}

function CityChart({ data }: { data: { city: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const COLORS = ["#FF375F", "#FF9F0A", "#BF5AF2", "#30D158", "#5E5CE6", "#FF6B6B", "#64D2FF", "#FFD60A"];

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[12px] font-medium w-20 flex-shrink-0 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{d.city}</span>
          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
          <span className="text-[12px] font-semibold w-5 text-right flex-shrink-0" style={{ color: COLORS[i % COLORS.length] }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function AgeChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const COLORS = ["#FF375F", "#FF9F0A", "#BF5AF2", "#30D158", "#5E5CE6"];
  const H = 80;

  return (
    <div className="flex items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold" style={{ color: COLORS[i] }}>{d.count}</span>
          <div className="w-full rounded-t-[6px] overflow-hidden" style={{ height: H, background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="w-full rounded-t-[6px]"
              style={{ background: COLORS[i], marginTop: "auto" }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Videos Tab
───────────────────────────────────────────── */
function VideosTab() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const pw = () => sessionStorage.getItem(SESSION_KEY) ?? "";

  useEffect(() => {
    fetch("/api/admin/videos", { headers: { Authorization: `Bearer ${pw()}` } })
      .then((r) => r.json())
      .then((d) => { setVideos(d.videos ?? []); setLoading(false); })
      .catch(() => { setError("Videolar alınamadı"); setLoading(false); });
  }, []);

  const handleDownload = async (video: VideoItem) => {
    try {
      const res = await fetch(video.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cineamore-${video.jobId.slice(0, 8)}.mp4`;
      a.click();
    } catch {
      window.open(video.url, "_blank");
    }
  };

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex items-center justify-center py-24">
      <motion.div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70"
        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
    </motion.div>
  );

  if (error) return <div className="px-5 py-10 text-center text-white/40 text-sm">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="px-5 pb-10 flex flex-col gap-4">

      {/* Header stat */}
      <div className="flex items-center justify-between">
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          {videos.length === 0 ? "Henüz video yok" : `${videos.length} video oluşturuldu`}
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="glass rounded-[20px] py-16 flex flex-col items-center gap-3">
          <svg width="36" height="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="2" y="4" width="15" height="16" rx="3" />
            <path d="M17 8.5l5-3v13l-5-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Henüz tamamlanan video yok</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((video, i) => (
            <motion.div key={video.jobId}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-strong rounded-[20px] overflow-hidden">

              {/* Video player */}
              <div className="relative w-full" style={{ aspectRatio: "9/16", maxHeight: 320 }}>
                {playingId === video.jobId ? (
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                    playsInline
                    style={{ display: "block" }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    onClick={() => setPlayingId(video.jobId)}
                  >
                    {/* Gradient preview bg */}
                    <div className="absolute inset-0"
                      style={{ background: "linear-gradient(135deg, rgba(255,55,95,0.15) 0%, rgba(191,90,242,0.15) 100%)" }} />

                    {/* Play button */}
                    <motion.div
                      className="relative w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
                      whileTap={{ scale: 0.92 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </motion.div>

                    {/* Job ID badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {video.jobId.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta + actions */}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-white/70">
                    {video.createdAt ? formatDate(video.createdAt) : "—"}
                  </p>
                  {video.size && (
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {formatSize(video.size)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {playingId === video.jobId && (
                    <button onClick={() => setPlayingId(null)}
                      className="h-9 px-3 rounded-[12px] text-[12px] font-medium cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                      Kapat
                    </button>
                  )}
                  <button onClick={() => handleDownload(video)}
                    className="h-9 px-4 rounded-[12px] text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
                    style={{ background: "rgba(255,55,95,0.15)", color: "#FF375F", border: "1px solid rgba(255,55,95,0.25)" }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" />
                    </svg>
                    İndir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Helpers & Icons
───────────────────────────────────────────── */
function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function AmbienceGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,55,95,0.12) 0%, transparent 65%)" }} />
    </div>
  );
}
function MusicIcon() {
  return <svg width="20" height="20" fill="none" stroke="#FF375F" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
}
function UploadIcon() {
  return <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
}
function CheckIcon() {
  return <svg width="16" height="16" fill="none" stroke="#30D158" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>;
}
function UsersIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function TrendIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function AgeIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function CityIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
