import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { subscriptionsApi } from "@/api/subscriptions";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes lp-pulse1{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.2);opacity:.9}}
  @keyframes lp-pulse2{0%,100%{transform:scale(1.1);opacity:.4}50%{transform:scale(1);opacity:.7}}
  @keyframes lp-pulse3{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.15);opacity:.6}}
  @keyframes lp-fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes lp-fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes lp-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes lp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  .lp-root{box-sizing:border-box}
  .lp-root *{box-sizing:border-box}
  .lp-root::-webkit-scrollbar{width:6px}
  .lp-root::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
  .lp-btn-primary{
    padding:12px 28px;border-radius:12px;border:none;cursor:pointer;
    font-size:14px;font-weight:700;font-family:inherit;
    background:linear-gradient(135deg,#00f0ff,#6366f1);
    color:#0a0a0f;
    box-shadow:0 0 30px rgba(0,240,255,.3);
    transition:all .3s cubic-bezier(.4,0,.2,1);
  }
  .lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(0,240,255,.45)}
  .lp-btn-outline{
    padding:12px 28px;border-radius:12px;cursor:pointer;
    font-size:14px;font-weight:600;font-family:inherit;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.12);
    color:#e2e8f0;
    transition:all .3s;
  }
  .lp-btn-outline:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22)}
  .lp-mode-card{
    padding:26px 24px;border-radius:20px;
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.07);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    cursor:pointer;position:relative;overflow:hidden;
    transition:all .35s cubic-bezier(.4,0,.2,1);
  }
  .lp-mode-card:hover{transform:translateY(-4px)}
  .lp-mode-card-inner{display:flex;flex-direction:column}
  .lp-modes-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .lp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.07);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .lp-hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .lp-nav{display:flex;align-items:center;gap:8px}
  .lp-header-inner{max-width:1280px;margin:0 auto;padding:0 28px;height:64px;display:flex;align-items:center;justify-content:space-between}
  @media(max-width:640px){
    .lp-modes-grid{grid-template-columns:1fr;gap:12px}
    .lp-modes-grid>*{grid-column:auto!important}
    .lp-mode-card{padding:16px 18px;border-radius:16px;height:auto}
    .lp-mode-card:hover{transform:none}
    .lp-mode-card-inner{flex-direction:row;align-items:center;gap:16px}
    .lp-stats-grid{grid-template-columns:repeat(2,1fr)}
    .lp-hero-btns{flex-direction:column;align-items:stretch;padding:0 4px}
    .lp-btn-primary,.lp-btn-outline{width:100%;text-align:center}
    .lp-nav .lp-username{display:none}
    .lp-header-inner{padding:0 16px}
    section,.lp-stats-wrap{padding-left:16px!important;padding-right:16px!important}
  }
`;

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES = [
  {
    id: "topics", icon: "/pravadrive-icon-mavzular.svg", title: "Mavzular",
    desc: "Mavzu bo'yicha savollar · rivojlanishni kuzating",
    color: "#38bdf8", badge: "Tavsiya", to: "/topics", freeAccess: true,
  },
  {
    id: "bilets", icon: "/pravadrive-icon-biletlar.svg", title: "Biletlar",
    desc: "Rasmiy 100 ta bilet · aniq tartibda",
    color: "#10b981", badge: "100 ta", to: "/bilets", freeAccess: true,
  },
  {
    id: "exam", icon: "/pravadrive-icon-imtihon.svg", title: "Imtihon",
    desc: "20 ta savol · 25 daqiqa · 3 xato = rad etiladi",
    color: "#ef4444", badge: "Rasmiy", to: "/dashboard", flowType: 4, freeAccess: false,
  },
  {
    id: "marathon", icon: "/pravadrive-icon-marafon.svg", title: "Marafon",
    desc: "Barcha faol savollar · vaqt chegarasi yo'q",
    color: "#f59e0b", badge: "Cheksiz", to: "/dashboard", flowType: 5, freeAccess: false,
  },
  {
    id: "custom", icon: "/pravadrive-icon-ixtiyoriy.svg", title: "Ixtiyoriy",
    desc: "Mavzularni tanlang · savol sonini belgilang",
    color: "#8b5cf6", badge: "Sozlanadi", to: "/dashboard", freeAccess: false,
  },
] as const;

// ─── Platform stats ───────────────────────────────────────────────────────────

const STATS = [
  { value: "1200+", label: "Savol", icon: "📝" },
  { value: "60+", label: "Biletlar", icon: "📋" },
  { value: "42", label: "Mavzular", icon: "📚" },
  { value: "∞", label: "Imtihon", icon: "🎮" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const isLoggedIn = !!accessToken;
  const isPrivileged = !!(user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role));

  const [mounted, setMounted] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    if (!document.getElementById("lp-fonts")) {
      const link = document.createElement("link");
      link.id = "lp-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: subscriptionsApi.getMy,
    enabled: isLoggedIn && !isPrivileged,
    retry: false,
  });

  const hasAccess = isPrivileged || (isLoggedIn && subscription?.isActive === true);

  const handleModeClick = (mode: typeof MODES[number]) => {
    if (!isLoggedIn) { setAuthModal(true); return; }
    if (!mode.freeAccess && !hasAccess) { setSubModal(true); return; }
    navigate(mode.to);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="lp-root"
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e2e8f0",
        fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{CSS}</style>

      {/* ── Ambient blobs ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,240,255,.07) 0%,transparent 70%)", filter: "blur(90px)", animation: "lp-pulse1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", filter: "blur(110px)", animation: "lp-pulse2 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "45%", right: "25%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,.04) 0%,transparent 70%)", filter: "blur(70px)", animation: "lp-pulse3 15s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          background: "rgba(10,10,15,.7)",
        }}>
          <div className="lp-header-inner">

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img src="/pravadrive-logo-horizontal.svg" alt="pravadrive" style={{ height: 42, width: "auto" }} />
            </div>

            {/* Nav */}
            <nav className="lp-nav" style={{ gap: 8 }}>
              {isLoggedIn ? (
                <>
                  <span className="lp-username" style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>
                    {user?.firstName ?? user?.email?.split("@")[0]}
                  </span>
                  <button
                    className="lp-btn-outline"
                    style={{ padding: "9px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}
                    onClick={() => navigate("/subscription")}
                  >
                    <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 16, height: 16 }} />
                    Obuna
                  </button>
                  <button
                    className="lp-btn-primary"
                    style={{ padding: "9px 22px", fontSize: 13 }}
                    onClick={() => navigate("/dashboard")}
                  >
                    Dashboard →
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="lp-btn-outline"
                    style={{ padding: "9px 22px", fontSize: 13 }}
                    onClick={() => navigate("/login")}
                  >
                    Kirish
                  </button>
                  <button
                    className="lp-btn-primary"
                    style={{ padding: "9px 22px", fontSize: 13 }}
                    onClick={() => navigate("/register")}
                  >
                    Ro'yxatdan o'tish
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* ── Hero ── */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 28px 80px", textAlign: "center" }}>
          <div style={{ animation: mounted ? "lp-fadeUp .8s ease both" : "none" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 18px", borderRadius: 100,
              background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)",
              marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f0ff", boxShadow: "0 0 8px #00f0ff", display: "inline-block", animation: "lp-pulse1 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#00f0ff", letterSpacing: "0.04em" }}>
                Haydovchilik imtihoniga tayyorlanish platformasi
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 24,
              background: "linear-gradient(135deg, #ffffff 20%, #94a3b8 60%, #6366f1 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "lp-shimmer 6s linear infinite",
            }}>
              Birinchi urinishdayoq<br />Imtihondan o'ting!
            </h1>

            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#64748b", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
              1200+ savol, 60+ ta rasmiy bilet, Cheksiz test rejimi. Mavzular bo'yicha o'rganib, imtihon formatida mashq qiling.
            </p>

            <div className="lp-hero-btns">
              <button
                className="lp-btn-primary"
                style={{ fontSize: 15, padding: "14px 36px" }}
                onClick={() => isLoggedIn ? navigate("/dashboard") : navigate("/register")}
              >
                {isLoggedIn ? "Dashboardga o'tish →" : "Bepul boshlash →"}
              </button>
              {!isLoggedIn && (
                <button
                  className="lp-btn-outline"
                  style={{ fontSize: 15, padding: "14px 36px" }}
                  onClick={() => navigate("/login")}
                >
                  Kirish
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <div className="lp-stats-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px 80px", animation: mounted ? "lp-fadeUp .8s ease .15s both" : "none" }}>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 24px", textAlign: "center",
                  background: "rgba(255,255,255,.02)",
                  borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#00f0ff", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 0 20px rgba(0,240,255,.3)", marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modes section ── */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px 100px" }}>

          <div style={{ textAlign: "center", marginBottom: 56, animation: mounted ? "lp-fadeUp .8s ease .2s both" : "none" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 14, background: "linear-gradient(135deg,#fff,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Test rejimlari
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
              {isLoggedIn && hasAccess
                ? "Rejimni tanlang va mashqni boshlang"
                : isLoggedIn
                  ? "Biletlar va mavzular bepul · Imtihon va marafon uchun obuna kerak"
                  : "Biletlar va mavzular bepul · Barcha rejimlar uchun ro'yxatdan o'ting"}
            </p>
          </div>

          <div className="lp-modes-grid" style={{ animation: mounted ? "lp-fadeUp .8s ease .25s both" : "none" }}>
            {MODES.map((mode, i) => {
              const hovered = hoveredMode === mode.id;
              const needsAuth = !isLoggedIn;
              const needsSub = isLoggedIn && !hasAccess && !mode.freeAccess;
              const demoHint = isLoggedIn && !hasAccess && mode.freeAccess;
              const locked = needsAuth || needsSub;
              return (
                <div
                  key={mode.id}
                  className="lp-mode-card"
                  onMouseEnter={() => setHoveredMode(mode.id)}
                  onMouseLeave={() => setHoveredMode(null)}
                  onClick={() => handleModeClick(mode)}
                  style={{
                    borderColor: hovered ? mode.color + "30" : "rgba(255,255,255,.07)",
                    boxShadow: hovered ? `0 12px 40px ${mode.color}18` : "none",
                    gridColumn: i === 3 ? "1 / 2" : i === 4 ? "2 / 3" : "auto",
                  }}
                >
                  {/* Glow bg */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${mode.color}10,transparent)`, transition: "opacity .3s", opacity: hovered ? 1 : 0 }} />

                  <div className="lp-mode-card-inner">
                    {/* Icon */}
                    <div style={{ flexShrink: 0 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: `linear-gradient(135deg, ${mode.color}20, ${mode.color}10)`,
                        border: `1px solid ${mode.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: hovered ? `0 0 20px ${mode.color}25` : "none",
                        transition: "box-shadow .3s",
                      }}>
                        <img src={mode.icon} alt={mode.title} style={{ width: 28, height: 28 }} />
                      </div>
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em", margin: 0 }}>
                          {mode.title}
                        </h3>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: `${mode.color}15`, color: mode.color, letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0 }}>
                          {mode.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: "0 0 10px" }}>
                        {mode.desc}
                      </p>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600,
                        color: locked ? "#475569" : demoHint ? mode.color : mode.color,
                      }}>
                        {needsAuth ? (
                          <><span style={{ fontSize: 11 }}>🔒</span><span>Kirish kerak</span></>
                        ) : needsSub ? (
                          <><span style={{ fontSize: 11 }}>🔒</span><span>Obuna kerak</span></>
                        ) : demoHint ? (
                          <><span>▶</span><span style={{ transition: "transform .2s", transform: hovered ? "translateX(4px)" : "translateX(0)" }}>Demo bepul · Ko'rish</span></>
                        ) : (
                          <><span>▶</span><span style={{ transition: "transform .2s", transform: hovered ? "translateX(4px)" : "translateX(0)" }}>Boshlash</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Access hint */}
          {!isLoggedIn && (
            <div style={{
              marginTop: 32, padding: "18px 24px", borderRadius: 14,
              background: "rgba(0,240,255,.04)", border: "1px solid rgba(0,240,255,.12)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16,
              animation: mounted ? "lp-fadeUp .8s ease .35s both" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Demo bilet bepul!</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Ro'yxatdan o'tmasdan ham 1 ta demo biletni sinab ko'ring</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="lp-btn-outline" style={{ fontSize: 13, padding: "9px 20px" }} onClick={() => navigate("/login")}>Kirish</button>
                <button className="lp-btn-primary" style={{ fontSize: 13, padding: "9px 20px" }} onClick={() => navigate("/register")}>Ro'yxatdan o'tish</button>
              </div>
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "32px 28px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/pravadrive-symbol.svg" alt="pravadrive" style={{ height: 24, width: 24 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>pravadrive · O'zbekiston 2026</span>
            </div>
            <span style={{ fontSize: 12, color: "#334155" }}>Haydovchilik imtihoniga professional tayyorlanish</span>
          </div>
        </footer>
      </div>

      {/* ── Auth required modal ── */}
      {authModal && (
        <Modal onClose={() => setAuthModal(false)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
              Kirish kerak
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>
              Testlarni boshlash uchun tizimga kiring yoki ro'yxatdan o'ting
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="lp-btn-outline" style={{ fontSize: 14 }} onClick={() => { setAuthModal(false); navigate("/login"); }}>
                Kirish
              </button>
              <button className="lp-btn-primary" style={{ fontSize: 14 }} onClick={() => { setAuthModal(false); navigate("/register"); }}>
                Ro'yxatdan o'tish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Subscription required modal ── */}
      {subModal && (
        <Modal onClose={() => setSubModal(false)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
              Obuna kerak
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>
              Barcha test rejimlaridan foydalanish uchun faol obuna kerak
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="lp-btn-outline" style={{ fontSize: 14 }} onClick={() => setSubModal(false)}>
                Yopish
              </button>
              <button className="lp-btn-primary" style={{ fontSize: 14 }} onClick={() => { setSubModal(false); navigate("/subscription"); }}>
                Obuna olish →
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Simple modal wrapper ─────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "#111117", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 24, padding: 40, maxWidth: 400, width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,.6)",
          animation: "lp-fadeUp .3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >×</button>
        {children}
      </div>
    </div>
  );
}
