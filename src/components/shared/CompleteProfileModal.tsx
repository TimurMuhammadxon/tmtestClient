import { useState } from "react";
import { profileApi } from "@/api/profile";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/lib/i18n";
import axios from "axios";

export function CompleteProfileModal({ onClose }: { onClose: () => void }) {
  const t = useTranslation();
  const { refreshToken, setTokens } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!firstName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await profileApi.update(firstName.trim(), lastName.trim() || null);
      if (refreshToken) {
        const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
          "/api/auth/refresh",
          { refreshToken }
        );
        setTokens(data.accessToken, data.refreshToken);
      }
      onClose();
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "#111117", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: 32, width: "100%", maxWidth: 380,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          fontFamily: "'Outfit', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(124,58,237,0.15))",
            border: "1px solid rgba(0,240,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>👋</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
            {t.firstName} {t.lastName}
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            {t.enterAccount}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>
              {t.firstName} *
            </label>
            <input
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,240,255,0.15)",
                color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t.firstName}
              maxLength={100}
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>
              {t.lastName}
            </label>
            <input
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,240,255,0.15)",
                color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t.lastName}
              maxLength={100}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
              }}
            >{t.close}</button>
            <button
              onClick={handleSave}
              disabled={saving || !firstName.trim()}
              style={{
                flex: 1, padding: "10px", borderRadius: 10,
                background: saving || !firstName.trim() ? "rgba(0,240,255,0.2)" : "linear-gradient(135deg,#00f0ff,#6366f1)",
                border: "none",
                color: saving || !firstName.trim() ? "#64748b" : "#0a0a0f",
                cursor: saving || !firstName.trim() ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
