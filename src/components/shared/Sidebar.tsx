import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ChevronLeft,
  Menu,
  LogOut,
  ClipboardList,
  FileText,
  MessageSquare,
  BookOpen,
  HelpCircle,
  Settings,
  Banknote,
  UserCog,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { type AuthUser } from "@/types";
import { authApi } from "@/api/auth";
import { profileApi } from "@/api/profile";
import { useTranslation } from "@/lib/i18n";
import { useLanguageStore, type LangCode } from "@/store/language";

type IconType = React.ElementType | string;

interface NavItem {
  to: string;
  icon: IconType;
  label: string;
  roles?: string[];
}

function useNavItems() {
  const t = useTranslation();
  const navItems: NavItem[] = [
    { to: "/dashboard",           icon: "/pravadrive-icon-umumiy.svg",      label: t.dashboard },
    { to: "/progress",            icon: "/pravadrive-icon-natijalarim.svg", label: t.progress },
    { to: "/subscription",        icon: "/pravadrive-icon-obuna.svg",       label: t.subscription },
    { to: "/teacher-application", icon: ClipboardList,                      label: t.applyTeacher },
  ];
  const teacherItems: NavItem[] = [
    { to: "/teacher/groups",      icon: "/pravadrive-icon-guruhlar.svg",  label: t.groups },
    { to: "/teacher/test-links",  icon: "/pravadrive-icon-havolalar.svg", label: t.testLinks },
  ];
  const adminItems: NavItem[] = [
    { to: "/admin/topics",       icon: FileText,      label: t.topics },
    { to: "/admin/questions",    icon: MessageSquare, label: t.questions },
    { to: "/admin/bilets",       icon: BookOpen,      label: t.bilets },
    { to: "/admin/applications", icon: HelpCircle,    label: t.applications },
    { to: "/admin/plans",        icon: Settings,      label: t.plans },
    { to: "/admin/users",        icon: UserCog,       label: t.users, roles: ["Owner"] },
    { to: "/admin/payments",     icon: Banknote,      label: t.payments,    roles: ["Owner"] },
  ];
  return { navItems, teacherItems, adminItems };
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: "uz-latn", label: "UZ" },
  { code: "ru",      label: "РУ" },
  { code: "uz-cyrl", label: "ЎЗ" },
];

export function Sidebar({ collapsed, onToggle, mobile, onClose }: SidebarProps) {
  const { user, clearAuth, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const { navItems, teacherItems, adminItems } = useNavItems();
  const t = useTranslation();
  const { lang, setLang } = useLanguageStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const isTeacher = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const isAdmin = user && ["Admin", "SuperAdmin", "Owner"].includes(user.role);
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.email?.split("@")[0] ?? "";
  const initials = user?.firstName
    ? user.firstName.slice(0, 1).toUpperCase() + (user.lastName?.slice(0, 1).toUpperCase() ?? "")
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <>
    <aside
      style={{
        background: "linear-gradient(180deg, #0d0d16 0%, #0a0a12 100%)",
        borderRight: "1px solid rgba(0, 240, 255, 0.08)",
        fontFamily: "'Outfit', sans-serif",
      }}
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        mobile ? "w-72" : collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid rgba(0, 240, 255, 0.08)" }}
        className="flex items-center justify-between p-4 h-16"
      >
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => navigate("/")}>
            <img
              src="/pravadrive-logo-horizontal.svg"
              alt="pravadrive"
              style={{ height: 36, width: "auto", maxWidth: 150 }}
            />
          </div>
        )}
        {collapsed && !mobile && (
          <img
            src="/pravadrive-symbol.svg"
            alt="pravadrive"
            style={{ height: 28, width: 28, margin: "0 auto", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
        )}
        {!mobile && (
          <button
            onClick={onToggle}
            style={{ color: "rgba(148, 163, 184, 0.6)" }}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
        {mobile && (
          <button
            onClick={onClose}
            style={{ color: "rgba(148, 163, 184, 0.6)" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
        ))}

        {isTeacher && (
          <>
            <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.06)" }} className="my-2 mx-2" />
            {(!collapsed || mobile) && (
              <p
                style={{ color: "rgba(0, 240, 255, 0.4)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em" }}
                className="px-3 py-1 uppercase"
              >
                {t.teacher}
              </p>
            )}
            {teacherItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.06)" }} className="my-2 mx-2" />
            {(!collapsed || mobile) && (
              <p
                style={{ color: "rgba(139, 92, 246, 0.5)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em" }}
                className="px-3 py-1 uppercase"
              >
                Admin
              </p>
            )}
            {adminItems
              .filter((item) => !item.roles || item.roles.includes(user?.role ?? ""))
              .map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
              ))}
          </>
        )}
      </nav>

      {/* Language switcher */}
      <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.08)" }} className="px-3 pt-2 pb-1">
        {collapsed && !mobile ? (
          <button
            onClick={() => {
              const idx = LANG_OPTIONS.findIndex((o) => o.code === lang);
              setLang(LANG_OPTIONS[(idx + 1) % LANG_OPTIONS.length].code);
            }}
            title={t.language}
            style={{ color: "#00f0ff", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}
            className="w-full h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            {LANG_OPTIONS.find((o) => o.code === lang)?.label}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.code}
                onClick={() => setLang(o.code)}
                style={{
                  flex: 1, padding: "5px 0", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all .2s",
                  background: lang === o.code ? "rgba(0,240,255,0.12)" : "transparent",
                  color: lang === o.code ? "#00f0ff" : "rgba(148,163,184,0.5)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.08)" }} className="p-3">
        <div className={cn("flex items-center gap-3", collapsed && !mobile && "justify-center")}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(124, 58, 237, 0.15))",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              color: "#00f0ff",
              fontSize: "11px",
              fontWeight: 700,
            }}
            className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center"
          >
            {initials}
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 500 }} className="truncate">
                {displayName}
              </p>
              <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "11px" }}>{user?.role}</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <button
              onClick={() => setSettingsOpen(true)}
              title="Sozlash"
              style={{ color: "rgba(148, 163, 184, 0.4)" }}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 hover:text-slate-300 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleLogout}
            title={t.logout}
            style={{ color: "rgba(148, 163, 184, 0.4)" }}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    {settingsOpen && (
      <SettingsModal
        user={user}
        onClose={() => setSettingsOpen(false)}
      />
    )}
    </>
  );
}

function SettingsModal({ user, onClose }: { user: AuthUser | null; onClose: () => void }) {
  const t = useTranslation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [tab, setTab] = useState<"profile" | "credentials">("profile");

  // Profile tab
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");

  // Credentials tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isTelegramUser = user?.email?.includes("@telegram.local");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,240,255,0.15)",
    color: "#e2e8f0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none",
  };

  const handleSaveProfile = async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      await profileApi.update(firstName || null, lastName || null);
      if (refreshToken) {
        const { data } = await import("axios").then(({ default: ax }) =>
          ax.post<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", { refreshToken })
        );
        setTokens(data.accessToken, data.refreshToken);
      }
      setSuccess(t.saved);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }
    if (password.length < 6) { setError(t.passwordMinLength); return; }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const res = await profileApi.setCredentials(isTelegramUser ? email : user!.email, password);
      setTokens(res.accessToken, res.refreshToken);
      setSuccess(t.credentialsSaved);
      setPassword(""); setConfirmPassword("");
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      setError(msg ?? t.error);
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
        style={{ position: "relative", zIndex: 1, background: "#111117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >×</button>

        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>{t.settings}</h3>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, padding: 4, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["profile", "credentials"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setError(null); setSuccess(null); }}
              style={{
                flex: 1, padding: "7px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500, fontFamily: "inherit", transition: "all .2s",
                background: tab === tabKey ? "rgba(0,240,255,0.12)" : "transparent",
                color: tab === tabKey ? "#00f0ff" : "#64748b",
              }}
            >
              {tabKey === "profile" ? t.profile : t.credentials}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{user?.email}</p>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>{t.firstName}</label>
              <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.firstName} maxLength={100} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>{t.lastName}</label>
              <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t.lastName} maxLength={100} />
            </div>
            {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: "#10b981" }}>{success}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{t.cancel}</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: 10, background: saving ? "rgba(0,240,255,0.2)" : "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: saving ? "#64748b" : "#0a0a0f", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        )}

        {/* Credentials tab */}
        {tab === "credentials" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isTelegramUser && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)", fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                {t.telegramNote}
              </div>
            )}
            {isTelegramUser && (
              <div>
                <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>{t.newPassword}</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.minChars} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", display: "block", marginBottom: 6 }}>{t.confirmPassword}</label>
              <input style={inputStyle} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.confirmPasswordAgain} />
            </div>
            {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: "#10b981" }}>{success}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{t.cancel}</button>
              <button onClick={handleSaveCredentials} disabled={saving || !password || (isTelegramUser ? !email : false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: saving ? "rgba(0,240,255,0.2)" : "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: saving ? "#64748b" : "#0a0a0f", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  collapsed,
  onClose,
}: {
  item: NavItem;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const Icon = item.icon;
  const isImgIcon = typeof Icon === "string";

  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
          isActive ? "sidebar-link-active" : "sidebar-link-inactive",
          collapsed && "justify-center px-2"
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))",
              color: "#00f0ff",
              boxShadow: "inset 0 0 0 1px rgba(0, 240, 255, 0.2), 0 0 12px rgba(0, 240, 255, 0.05)",
            }
          : {
              color: "rgba(148, 163, 184, 0.7)",
            }
      }
    >
      {({ isActive }) => (
        <>
          {isImgIcon ? (
            <img
              src={Icon as string}
              alt=""
              className="h-4 w-4 flex-shrink-0 transition-all duration-200"
              style={{
                opacity: isActive ? 1 : 0.6,
                filter: isActive ? "drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))" : "none",
              }}
            />
          ) : (
            <Icon
              className="h-4 w-4 flex-shrink-0 transition-all duration-200"
              style={isActive ? { filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))" } : {}}
            />
          )}
          {!collapsed && (
            <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
