import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { topicsApi, type TopicStudentDto } from "@/api/topics";
import { subscriptionsApi } from "@/api/subscriptions";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { CompleteProfileModal } from "@/components/shared/CompleteProfileModal";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

function AnimatedNumber({ value, suffix = "", duration = 1200 }: {
  value: number; suffix?: string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = value / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [value, duration]);
  return <>{display}{suffix}</>;
}

function CircularProgress({ value, size = 100, stroke = 8, color = "#00f0ff" }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
    </svg>
  );
}

const CSS = `
  @keyframes dp-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dp-fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes dp-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  .dp-root *{box-sizing:border-box}
  .dp-root::-webkit-scrollbar{width:6px}
  .dp-root::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
  .dp-container{padding:28px}
  .dp-stats-grid{display:grid;grid-template-columns:1fr repeat(3,1fr);gap:16px;margin-bottom:26px}
  .dp-modes-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:24px}
  .dp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
  .dp-exam-btn{padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,rgba(0,240,255,.12),rgba(99,102,241,.12));border:1px solid rgba(0,240,255,.2);font-size:13px;font-weight:600;color:#00f0ff;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .3s;white-space:nowrap}
  .dp-header-btns{display:flex;gap:10px;align-items:center}
  @media(max-width:900px){
    .dp-modes-grid{grid-template-columns:repeat(3,1fr)}
  }
  @media(max-width:640px){
    .dp-container{padding:16px}
    .dp-stats-grid{grid-template-columns:repeat(2,1fr);gap:10px}
    .dp-stats-grid>:first-child{grid-column:1/-1}
    .dp-modes-grid{grid-template-columns:repeat(2,1fr);gap:10px}
    .dp-header{flex-direction:column;align-items:flex-start;gap:14px;margin-bottom:20px}
    .dp-header-btns{width:100%}
    .dp-exam-btn{flex:1;justify-content:center}
  }
`;

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const t = useTranslation();
  const isTeacher = !!(user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role));

  const needsProfile = !user?.firstName;
  const [profileDismissed, setProfileDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [subModal, setSubModal] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<{ flowType: number; title: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!document.getElementById("dp-fonts")) {
      const link = document.createElement("link");
      link.id = "dp-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: progressApi.dashboard });
  const { data: topics } = useQuery({ queryKey: ["topics-student"], queryFn: topicsApi.list });
  const { data: mySubscription } = useQuery({ queryKey: ["my-subscription"], queryFn: subscriptionsApi.getMy });

  const subDaysLeft = mySubscription?.expiresAt
    ? Math.ceil((new Date(mySubscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const startFlow = async (flowType: number, extra?: { topicIds?: string[]; questionCount?: number }) => {
    const k = String(flowType);
    setStarting(k);
    try {
      const { id } = await attemptsApi.start({ flowType, ...extra });
      navigate(`/attempts/${id}`);
    } catch (e: unknown) {
      const status = (e as any)?.response?.status;
      const detail = (e as any)?.response?.data?.detail ?? "";
      if (status === 409 && detail.toLowerCase().includes("subscription")) {
        setSubModal(true);
      } else {
        const msg = (e as any)?.response?.data?.title ?? detail;
        toast({ variant: "destructive", title: msg ?? t.testFailed });
      }
    } finally { setStarting(null); }
  };

  const activeTopics = (topics ?? []).filter((tp) => !tp.isDemo);

  const examPrediction = dashboard?.examPassPrediction ?? 0;
  const accuracy = Math.round(dashboard?.accuracyPercent ?? 0);
  const streak = dashboard?.currentStreak ?? 0;
  const totalAnswered = dashboard?.totalAnswered ?? 0;
  const totalCorrect = dashboard?.totalCorrect ?? 0;

  const MODES = [
    { id: "topics", icon: "/pravadrive-icon-mavzular.svg", title: t.modeTopics, desc: t.modeTopicsDesc, color: "#38bdf8", badge: t.badgeRecommend, action: () => navigate("/topics"), flowType: 2 },
    { id: "bilets", icon: "/pravadrive-icon-biletlar.svg", title: t.modeBilets, desc: t.modeBiletsDesc, color: "#10b981", badge: t.badgeCount, action: () => navigate("/bilets"), flowType: 1 },
    { id: "exam", icon: "/pravadrive-icon-imtihon.svg", title: t.modeExam, desc: t.examModeDesc, color: "#ef4444", badge: t.badgeOfficial, action: () => startFlow(4), flowType: 4 },
    { id: "marathon", icon: "/pravadrive-icon-marafon.svg", title: t.modeMarathon, desc: t.marathonDesc, color: "#f59e0b", badge: t.badgeUnlimited, action: () => startFlow(5), flowType: 5 },
    { id: "custom", icon: "/pravadrive-icon-ixtiyoriy.svg", title: t.modeCustom, desc: t.customTestDesc, color: "#8b5cf6", badge: t.badgeCustomizable, action: () => setCustomOpen(true), flowType: 3 },
  ];

  return (
    <div className="dp-root -m-4 md:-m-6" style={{ minHeight: "100%", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Outfit', system-ui, -apple-system, sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{CSS}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,240,255,.05) 0%,transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 65%)" }} />
      </div>

      <div className="dp-container" style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto" }}>

        {/* Free-trial banner (first 24h) */}
        {mySubscription?.isTrial && (
          <div onClick={() => navigate("/subscription")} style={{ cursor: "pointer", marginBottom: 16, padding: "12px 18px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.25)", animation: "dp-fadeIn .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎁</span>
              <span style={{ fontSize: 14, color: "#00f0ff", fontWeight: 500 }}>
                {t.trialActive} · {t.trialHoursLeft.replace("{hours}", String(Math.max(0, Math.ceil((new Date(mySubscription.expiresAt).getTime() - Date.now()) / 3600000))))}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>{t.subscription} →</span>
          </div>
        )}

        {/* Subscription expiry banner */}
        {!mySubscription?.isTrial && subDaysLeft !== null && subDaysLeft <= 3 && (
          <div onClick={() => navigate("/subscription")} style={{ cursor: "pointer", marginBottom: 16, padding: "12px 18px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: subDaysLeft <= 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.10)", border: `1px solid ${subDaysLeft <= 0 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, animation: "dp-fadeIn .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{subDaysLeft <= 0 ? "🔴" : "⚠️"}</span>
              <span style={{ fontSize: 14, color: subDaysLeft <= 0 ? "#f87171" : "#fbbf24", fontWeight: 500 }}>
                {subDaysLeft <= 0 ? t.subExpired : subDaysLeft === 1 ? t.subExpirestoday : t.subExpiresSoon.replace("{days}", String(subDaysLeft))}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>{t.pay} →</span>
          </div>
        )}

        {/* Header */}
        <div className="dp-header" style={{ animation: mounted ? "dp-fadeIn .6s ease" : "none" }}>
          <div>
            <p style={{ fontSize: 15, color: "#64748b" }}>
              {t.hello}, <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{user?.firstName ?? user?.email?.split("@")[0]}</span>! {t.practiceToday}
            </p>
          </div>
          <div className="dp-header-btns">
            <button onClick={() => navigate("/subscription")} style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", transition: "all .3s", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.3)"; e.currentTarget.style.color = "#00f0ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 18, height: 18 }} />
              {t.subscription}
            </button>
            <button disabled={!!starting} onClick={() => startFlow(4)} className="dp-exam-btn" style={{ fontFamily: "inherit", cursor: starting ? "wait" : "pointer", opacity: starting === "4" ? 0.7 : 1 }}>
              ⚡ {starting === "4" ? t.loading : t.startExam}
            </button>
          </div>
        </div>

        {/* Stats: Ring + 3 cards */}
        <div className="dp-stats-grid" style={{ animation: mounted ? "dp-slideUp .6s ease .1s both" : "none" }}>
          {/* Readiness ring card */}
          <div style={{ padding: "26px 22px", borderRadius: 18, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 18, position: "relative", overflow: "hidden", transition: "all .3s" }}
            onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid rgba(0,240,255,0.3)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,240,255,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <CircularProgress value={examPrediction} size={96} stroke={8} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#00f0ff", fontFamily: "'JetBrains Mono', monospace" }}>
                  <AnimatedNumber value={examPrediction} suffix="%" />
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{t.examReadiness}</span>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
                {examPrediction >= 80 ? t.readinessGreat : examPrediction >= 60 ? t.readinessGood : t.readinessNeedMore}
              </p>
            </div>
          </div>

          {/* 3 stat cards */}
          {([
            { label: t.accuracyRate, value: accuracy, suffix: "%", color: "#10b981", icon: "/pravadrive-icon-togrilik.svg", sub: `${totalAnswered} ${t.answersGiven}` },
            { label: t.correctAnswers, value: totalCorrect, suffix: "", color: "#8b5cf6", icon: "/pravadrive-icon-natijalarim.svg", sub: `${totalAnswered} ${t.outOfQuestions}` },
            { label: t.consecutiveDays, value: streak, suffix: "", color: "#f59e0b", icon: "🔥", sub: `${t.record}: ${dashboard?.longestStreak ?? 0} ${t.days}` },
          ] as const).map((card, i) => (
            <div key={i} style={{ padding: "26px 22px", borderRadius: 18, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", position: "relative", overflow: "hidden", transition: "all .3s", cursor: "default" }}
              onMouseEnter={(e) => { e.currentTarget.style.border = `1px solid ${card.color}30`; e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}15`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle,${card.color}08,transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{card.label}</span>
                {card.icon.startsWith("/") ? <img src={card.icon} alt="" style={{ width: 26, height: 26 }} /> : <span style={{ fontSize: 22 }}>{card.icon}</span>}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: card.color, marginBottom: 6, textShadow: `0 0 30px ${card.color}40`, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                <AnimatedNumber value={card.value} suffix={card.suffix} />
              </div>
              <span style={{ fontSize: 12, color: "#64748b" }}>{card.sub}</span>
            </div>
          ))}
        </div>

        {/* Mode cards (like LandingPage) */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginBottom: 20, paddingTop: 20, animation: mounted ? "dp-slideUp .6s ease .15s both" : "none" }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{t.testModes}</h2>
        </div>
        <div className="dp-modes-grid" style={{ animation: mounted ? "dp-slideUp .6s ease .15s both" : "none" }}>
          {MODES.map((mode) => {
            const hovered = hoveredMode === mode.id;
            const isStarting = starting === (mode.id === "exam" ? "4" : mode.id === "marathon" ? "5" : "");
            return (
              <div
                key={mode.id}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
                onClick={() => { if (!starting) mode.action(); }}
                style={{
                  padding: "28px 24px", borderRadius: 20,
                  background: hovered ? `linear-gradient(135deg,${mode.color}08,${mode.color}12)` : "rgba(255,255,255,.025)",
                  border: `1px solid ${hovered ? mode.color + "30" : "rgba(255,255,255,.07)"}`,
                  cursor: isStarting ? "wait" : "pointer",
                  transition: "all .35s cubic-bezier(.4,0,.2,1)",
                  transform: hovered ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: hovered ? `0 12px 40px ${mode.color}18` : "none",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle,${mode.color}10,transparent)`, transition: "opacity .3s", opacity: hovered ? 1 : 0 }} />
                {isTeacher && mode.id !== "topics" && mode.id !== "bilets" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLinkMode({ flowType: mode.flowType, title: mode.title }); }}
                    style={{ position: "absolute", top: 12, right: 12, width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, transition: "all .2s", zIndex: 2 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.borderColor = "rgba(0,240,255,.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                    title={t.createLink}
                  >🔗</button>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, borderRadius: 14, background: `linear-gradient(135deg, ${mode.color}20, ${mode.color}10)`, border: `1px solid ${mode.color}25`, marginBottom: 16, boxShadow: hovered ? `0 0 16px ${mode.color}25` : "none", transition: "box-shadow .3s" }}>
                  <img src={mode.icon} alt={mode.title} style={{ width: 30, height: 30 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.01em" }}>{mode.title}</h3>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: `${mode.color}15`, color: mode.color, textTransform: "uppercase", flexShrink: 0 }}>{mode.badge}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Complete profile modal */}
      {needsProfile && !profileDismissed && (
        <CompleteProfileModal onClose={() => setProfileDismissed(true)} />
      )}

      {/* Teacher link dialog */}
      {linkMode && (
        <CreateTestLinkDialog open onClose={() => setLinkMode(null)} defaultTitle={linkMode.title} flowType={linkMode.flowType} />
      )}

      {/* Custom test dialog */}
      <CustomTestDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        topics={activeTopics}
        onStart={(topicIds, count) => { setCustomOpen(false); startFlow(3, { topicIds, questionCount: count }); }}
        isStarting={starting === "3"}
      />

      {/* Subscription modal */}
      {subModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSubModal(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} />
          <div style={{ position: "relative", zIndex: 1, background: "#111117", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 40, maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.6)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSubModal(false)} style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 56, height: 56, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{t.subscriptionRequired}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>{t.subscriptionRequiredDesc}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setSubModal(false)} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{t.close}</button>
              <button onClick={() => { setSubModal(false); navigate("/subscription"); }} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: "#0a0a0f", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>{t.getSubscription} →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTestDialog({ open, onClose, topics, onStart, isStarting }: {
  open: boolean; onClose: () => void; topics: TopicStudentDto[]; onStart: (topicIds: string[], count: number) => void; isStarting: boolean;
}) {
  const t = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(20);
  const toggleAll = () => setSelected(selected.length === topics.length ? [] : topics.map((tp) => tp.id));
  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const effectiveTopics = selected.length === 0 ? topics.map((tp) => tp.id) : selected;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle>{t.customTestSettings}</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t.topics}</p>
              <button className="text-xs text-primary hover:underline" onClick={toggleAll}>{selected.length === topics.length ? t.deselectAll : t.selectAll}</button>
            </div>
            <p className="text-xs text-muted-foreground">{selected.length === 0 ? t.noneSelected : `${selected.length} ${t.selectedCount}`}</p>
            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {topics.map((tp) => (
                <label key={tp.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer">
                  <Checkbox checked={selected.includes(tp.id)} onCheckedChange={() => toggle(tp.id)} />
                  <span className="text-sm">{tp.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t.questionCount}</p>
              <span className="text-2xl font-bold text-primary">{count}</span>
            </div>
            <Slider min={5} max={100} step={5} value={[count]} onValueChange={([v]) => setCount(v)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>100</span></div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={() => onStart(effectiveTopics, count)} disabled={isStarting}>{isStarting ? t.loading : t.start}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
