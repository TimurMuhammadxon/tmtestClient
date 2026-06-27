import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { subscriptionsApi } from "@/api/subscriptions";
import { biletsApi } from "@/api/bilets";
import { attemptsApi } from "@/api/attempts";
import { useTranslation } from "@/lib/i18n";
import { useLanguageStore, type LangCode } from "@/store/language";
import { Users, Link2, BarChart3, Zap } from "lucide-react";

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
  .lp-header-inner{max-width:1280px;margin:0 auto;padding:0 28px;height:64px;display:flex;align-items:center;justify-content:flex-end}
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
    .lp-teacher-grid{grid-template-columns:1fr!important;gap:12px!important}
  }
  @media(min-width:641px) and (max-width:900px){
    .lp-teacher-grid{grid-template-columns:repeat(2,1fr)!important}
  }
`;

const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: "uz-latn", label: "UZ" },
  { code: "ru",      label: "РУ" },
  { code: "uz-cyrl", label: "ЎЗ" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const t = useTranslation();
  const { lang, setLang } = useLanguageStore();
  const isLoggedIn = !!accessToken;
  const isPrivileged = !!(user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role));

  const [mounted, setMounted] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  useEffect(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam && !sessionStorage.getItem("tg_start_handled")) {
      sessionStorage.setItem("tg_start_handled", "1");
      navigate(`/t/${startParam}`, { replace: true });
      return;
    }
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

  const [startingDemo, setStartingDemo] = useState(false);

  const startDemoTest = async () => {
    setStartingDemo(true);
    try {
      const bilets = await biletsApi.list();
      const demo = bilets.find((b) => b.isDemo);
      if (!demo) { navigate("/bilets"); return; }
      const { id } = await attemptsApi.start({ flowType: 1, biletId: demo.id });
      navigate(`/attempts/${id}`);
    } catch {
      navigate("/bilets");
    } finally {
      setStartingDemo(false);
    }
  };

  const MODES = [
    { id: "topics", icon: "/pravadrive-icon-mavzular.svg", title: t.modeTopics, desc: t.modeTopicsDesc, color: "#38bdf8", badge: t.badgeRecommend, to: "/topics", freeAccess: true },
    { id: "bilets", icon: "/pravadrive-icon-biletlar.svg", title: t.modeBilets, desc: t.modeBiletsDesc, color: "#10b981", badge: t.badgeCount, to: "/bilets", freeAccess: true },
    { id: "exam", icon: "/pravadrive-icon-imtihon.svg", title: t.modeExam, desc: t.modeExamDesc, color: "#ef4444", badge: t.badgeOfficial, to: "/dashboard", freeAccess: false },
    { id: "marathon", icon: "/pravadrive-icon-marafon.svg", title: t.modeMarathon, desc: t.modeMarathonDesc, color: "#f59e0b", badge: t.badgeUnlimited, to: "/dashboard", freeAccess: false },
    { id: "custom", icon: "/pravadrive-icon-ixtiyoriy.svg", title: t.modeCustom, desc: t.modeCustomDesc, color: "#8b5cf6", badge: t.badgeCustomizable, to: "/dashboard", freeAccess: false },
  ];

  const STATS = [
    { value: "1200+", label: t.statQuestions, icon: "📝" },
    { value: "60+", label: t.statBilets, icon: "📋" },
    { value: "42", label: t.statTopics, icon: "📚" },
    { value: "∞", label: t.statExam, icon: "🎮" },
  ];

  const handleModeClick = (mode: typeof MODES[number]) => {
    if (!isLoggedIn) { setAuthModal(true); return; }
    if (!mode.freeAccess && !hasAccess) { setSubModal(true); return; }
    navigate(mode.to);
  };

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

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,240,255,.07) 0%,transparent 70%)", filter: "blur(90px)", animation: "lp-pulse1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", filter: "blur(110px)", animation: "lp-pulse2 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "45%", right: "25%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,.04) 0%,transparent 70%)", filter: "blur(70px)", animation: "lp-pulse3 15s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          background: "rgba(10,10,15,.7)",
        }}>
          <div className="lp-header-inner">
            <nav className="lp-nav" style={{ gap: 8 }}>
              {/* Language switcher */}
              <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", marginRight: 4 }}>
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.code}
                    onClick={() => setLang(o.code)}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                      background: lang === o.code ? "rgba(0,240,255,.15)" : "transparent",
                      color: lang === o.code ? "#00f0ff" : "rgba(148,163,184,.5)",
                      transition: "all .2s",
                    }}
                  >{o.label}</button>
                ))}
              </div>

              {isLoggedIn ? (
                <>
                  <span className="lp-username" style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>
                    {user?.firstName ?? user?.email?.split("@")[0]}
                  </span>
                  <button className="lp-btn-outline" style={{ padding: "9px 18px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }} onClick={() => navigate("/subscription")}>
                    <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 16, height: 16 }} />
                    {t.subscription}
                  </button>
                  <button className="lp-btn-primary" style={{ padding: "9px 22px", fontSize: 13, whiteSpace: "nowrap" }} onClick={() => navigate("/dashboard")}>
                    {t.account} →
                  </button>
                </>
              ) : (
                <>
                  <button className="lp-btn-outline" style={{ padding: "9px 22px", fontSize: 13 }} onClick={() => navigate("/login")}>{t.login}</button>
                  <button className="lp-btn-primary" style={{ padding: "9px 22px", fontSize: 13 }} onClick={() => navigate("/register")}>{t.register}</button>
                </>
              )}
            </nav>
          </div>
        </header>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "48px 28px 0", animation: mounted ? "lp-fadeUp .7s ease both" : "none" }}>
          <img src="/pravadrive-logo-horizontal.svg" alt="PravaDrive" style={{ height: 72, width: "auto" }} />
        </div>

        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px", textAlign: "center" }}>
          <div style={{ animation: mounted ? "lp-fadeUp .8s ease both" : "none" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 18px", borderRadius: 100,
              background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)",
              marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f0ff", boxShadow: "0 0 8px #00f0ff", display: "inline-block", animation: "lp-pulse1 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#00f0ff", letterSpacing: "0.04em" }}>{t.platformSubtitle}</span>
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24,
              background: "linear-gradient(135deg, #ffffff 20%, #94a3b8 60%, #6366f1 100%)", backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "lp-shimmer 6s linear infinite",
            }}>
              {t.heroTitle1}<br />{t.heroTitle2}
            </h1>

            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#64748b", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>{t.heroDesc}</p>

            <div className="lp-hero-btns">
              <button
                className="lp-btn-primary"
                style={{ fontSize: 15, padding: "14px 36px", opacity: startingDemo ? 0.7 : 1 }}
                disabled={startingDemo}
                onClick={() => startDemoTest()}
              >
                {startingDemo ? t.loading : `${t.startTrialTest} →`}
              </button>
              {!isLoggedIn && (
                <button className="lp-btn-outline" style={{ fontSize: 15, padding: "14px 36px" }} onClick={() => navigate("/login")}>{t.login}</button>
              )}
            </div>
          </div>
        </section>

        <div className="lp-stats-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px 80px", animation: mounted ? "lp-fadeUp .8s ease .15s both" : "none" }}>
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: "28px 24px", textAlign: "center", background: "rgba(255,255,255,.02)", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#00f0ff", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 0 20px rgba(0,240,255,.3)", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px 100px" }}>
          <div style={{ textAlign: "center", marginBottom: 56, animation: mounted ? "lp-fadeUp .8s ease .2s both" : "none" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 14, background: "linear-gradient(135deg,#fff,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.testModes}
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
              {isLoggedIn && hasAccess ? t.selectModeAndStart : isLoggedIn ? t.freeModesHint : t.registerHint}
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
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${mode.color}10,transparent)`, transition: "opacity .3s", opacity: hovered ? 1 : 0 }} />
                  <div className="lp-mode-card-inner">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${mode.color}20, ${mode.color}10)`,
                        border: `1px solid ${mode.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: hovered ? `0 0 20px ${mode.color}25` : "none",
                        transition: "box-shadow .3s",
                      }}>
                        <img src={mode.icon} alt={mode.title} style={{ width: 24, height: 24 }} />
                      </div>
                      <h3 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em", margin: 0 }}>{mode.title}</h3>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: `${mode.color}15`, color: mode.color, letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0 }}>{mode.badge}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 12px" }}>{mode.desc}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: locked ? "#475569" : mode.color }}>
                        {needsAuth ? (<><span style={{ fontSize: 11 }}>🔒</span><span>{t.loginRequired}</span></>) :
                         needsSub ? (<><span style={{ fontSize: 11 }}>🔒</span><span>{t.subscriptionRequired}</span></>) :
                         demoHint ? (<><span>▶</span><span style={{ transition: "transform .2s", transform: hovered ? "translateX(4px)" : "translateX(0)" }}>{t.demoFreeView}</span></>) :
                         (<><span>▶</span><span style={{ transition: "transform .2s", transform: hovered ? "translateX(4px)" : "translateX(0)" }}>{t.start}</span></>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{t.demoBiletFree}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{t.demoBiletFreeDesc}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="lp-btn-outline" style={{ fontSize: 13, padding: "9px 20px" }} onClick={() => navigate("/login")}>{t.login}</button>
                <button className="lp-btn-primary" style={{ fontSize: 13, padding: "9px 20px" }} onClick={() => navigate("/register")}>{t.register}</button>
              </div>
            </div>
          )}
        </section>

        {/* Teacher / Driving school section */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px 100px" }}>
          <div style={{ textAlign: "center", marginBottom: 48, animation: mounted ? "lp-fadeUp .8s ease .4s both" : "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.2)", marginBottom: 20 }}>
              <span style={{ fontSize: 14 }}>🎓</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.04em" }}>{t.teacher}</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 14, background: "linear-gradient(135deg,#a78bfa,#fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.teacherSectionTitle}
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              {t.teacherSectionDesc}
            </p>
          </div>

          <div className="lp-teacher-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, animation: mounted ? "lp-fadeUp .8s ease .45s both" : "none" }}>
            {([
              { Icon: Users, title: t.teacherFeature1Title, desc: t.teacherFeature1Desc, color: "#8b5cf6" },
              { Icon: Link2, title: t.teacherFeature2Title, desc: t.teacherFeature2Desc, color: "#06b6d4" },
              { Icon: BarChart3, title: t.teacherFeature3Title, desc: t.teacherFeature3Desc, color: "#10b981" },
              { Icon: Zap, title: t.teacherFeature4Title, desc: t.teacherFeature4Desc, color: "#f59e0b" },
            ] as const).map((f, i) => (
              <div key={i} style={{
                padding: "28px 24px", borderRadius: 20,
                background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                transition: "all .35s cubic-bezier(.4,0,.2,1)",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color + "30"; e.currentTarget.style.boxShadow = `0 12px 40px ${f.color}15`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle,${f.color}10,transparent)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${f.color}20, ${f.color}10)`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <f.Icon style={{ width: 22, height: 22, color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {!isLoggedIn && (
            <div style={{ textAlign: "center", marginTop: 40, animation: mounted ? "lp-fadeUp .8s ease .5s both" : "none" }}>
              <button className="lp-btn-primary" style={{ fontSize: 15, padding: "14px 36px" }} onClick={() => navigate("/register")}>
                {t.teacherCta} →
              </button>
            </div>
          )}
        </section>

        <footer style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "40px 28px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src="/pravadrive-symbol.svg" alt="pravadrive" style={{ height: 24, width: 24 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>PravaDrive</span>
                </div>
                <a href="tel:+998999852570" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  +998 99 985 25 70
                </a>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="https://t.me/PravaDriveUz" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.2)"; e.currentTarget.style.color = "#00f0ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.65l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.909z"/></svg>
                  Guruh
                </a>
                <a href="https://t.me/PravaDriveUzb" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.2)"; e.currentTarget.style.color = "#00f0ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.65l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.909z"/></svg>
                  Kanal
                </a>
                <a href="https://t.me/pravadrive_bot" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.2)"; e.currentTarget.style.color = "#00f0ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.65l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.909z"/></svg>
                  Bot
                </a>
                <a href="https://www.instagram.com/timurmuhammadxon/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.2)"; e.currentTarget.style.color = "#00f0ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </a>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,.04)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#334155" }}>© 2026 PravaDrive · O'zbekiston</span>
              <span style={{ fontSize: 12, color: "#334155" }}>{t.footerTag}</span>
            </div>
          </div>
        </footer>
      </div>

      {authModal && (
        <Modal onClose={() => setAuthModal(false)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{t.loginRequired}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>{t.loginRequiredDesc}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="lp-btn-outline" style={{ fontSize: 14 }} onClick={() => { setAuthModal(false); navigate("/login"); }}>{t.login}</button>
              <button className="lp-btn-primary" style={{ fontSize: 14 }} onClick={() => { setAuthModal(false); navigate("/register"); }}>{t.register}</button>
            </div>
          </div>
        </Modal>
      )}

      {subModal && (
        <Modal onClose={() => setSubModal(false)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{t.subscriptionRequired}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>{t.subscriptionRequiredDesc}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="lp-btn-outline" style={{ fontSize: 14 }} onClick={() => setSubModal(false)}>{t.close}</button>
              <button className="lp-btn-primary" style={{ fontSize: 14 }} onClick={() => { setSubModal(false); navigate("/subscription"); }}>{t.getSubscription} →</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
