import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { topicsApi, type TopicStudentDto } from "@/api/topics";
import { biletsApi } from "@/api/bilets";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/use-toast";
import type { RecentAttemptDto, TopicProgressDto, PublicBiletListItemDto } from "@/types";

// ─── Micro-components ─────────────────────────────────────────────────────────

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

function CircularProgress({ value, size = 140, stroke = 10, color = "#00f0ff" }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
    </svg>
  );
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{
        width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", borderRadius: 3,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        boxShadow: `0 0 12px ${color}60`,
        transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveWeeklyData(recentAttempts?: RecentAttemptDto[]) {
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const today = new Date();
  return days.map((day, i) => {
    const target = new Date(today);
    target.setDate(today.getDate() - (6 - i));
    const dayAttempts = (recentAttempts ?? []).filter((a) => {
      const d = new Date(a.startedAt);
      return d.toDateString() === target.toDateString() && a.status !== "InProgress";
    });
    const totalCorrect = dayAttempts.reduce((s, a) => s + (a.correctCount ?? 0), 0);
    const totalQ = dayAttempts.reduce((s, a) => s + a.totalQuestions, 0);
    return { day, tests: dayAttempts.length, correct: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0 };
  });
}

function topicColor(acc: number) {
  if (acc >= 80) return "#10b981";
  if (acc >= 50) return "#f59e0b";
  return "#ef4444";
}

function attemptStatusColor(status: string) {
  if (status === "Passed") return "#10b981";
  if (status === "Failed") return "#ef4444";
  return "#6366f1";
}

function attemptStatusLabel(status: string) {
  if (status === "Passed") return "O'tdi";
  if (status === "Failed") return "O'tmadi";
  if (status === "Completed") return "Yakunlandi";
  return "Jarayonda";
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes dp-pulse1{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:1}}
  @keyframes dp-pulse2{0%,100%{transform:scale(1.1);opacity:.5}50%{transform:scale(1);opacity:.8}}
  @keyframes dp-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dp-fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes dp-glow{0%,100%{box-shadow:0 0 20px rgba(0,240,255,.15)}50%{box-shadow:0 0 40px rgba(0,240,255,.3)}}
  @keyframes dp-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  .dp-root *{box-sizing:border-box}
  .dp-root::-webkit-scrollbar{width:6px}
  .dp-root::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
  .dp-container{padding:28px}
  .dp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
  .dp-main-grid{display:grid;grid-template-columns:1fr 340px;gap:18px}
  .dp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
  .dp-exam-btn{padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,rgba(0,240,255,.12),rgba(99,102,241,.12));border:1px solid rgba(0,240,255,.2);font-size:13px;font-weight:600;color:#00f0ff;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .3s;white-space:nowrap}
  .dp-header-btns{display:flex;gap:10px;align-items:center}
  @media(max-width:640px){
    .dp-container{padding:16px}
    .dp-stats-grid{grid-template-columns:repeat(2,1fr);gap:10px}
    .dp-main-grid{grid-template-columns:1fr}
    .dp-header{flex-direction:column;align-items:flex-start;gap:14px;margin-bottom:20px}
    .dp-header-btns{width:100%}
    .dp-exam-btn{flex:1;justify-content:center}
  }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = !!(user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role));

  const [activeTab, setActiveTab] = useState<"overview" | "bilets" | "topics">("overview");
  const [mounted, setMounted] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [subModal, setSubModal] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<{ flowType: number; title: string } | null>(null);
  const [linkBilet, setLinkBilet] = useState<PublicBiletListItemDto | null>(null);
  const [linkTopic, setLinkTopic] = useState<TopicProgressDto | null>(null);
  const [hoveredBilet, setHoveredBilet] = useState<string | null>(null);

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
  const { data: topicProgress } = useQuery({ queryKey: ["progress-topics"], queryFn: progressApi.topics });
  const { data: bilets } = useQuery({ queryKey: ["bilets"], queryFn: biletsApi.list });
  const { data: topics } = useQuery({ queryKey: ["topics-student"], queryFn: topicsApi.list });

  const startFlow = async (
    flowType: number,
    extra?: { topicIds?: string[]; questionCount?: number; biletId?: string },
    key?: string,
  ) => {
    const k = key ?? String(flowType);
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
        toast({ variant: "destructive", title: msg ?? "Test boshlanmadi. Qayta urinib ko'ring." });
      }
    } finally {
      setStarting(null);
    }
  };

  const weeklyData = deriveWeeklyData(dashboard?.recentAttempts);
  const activeTopics = (topics ?? []).filter((t) => !t.isDemo);
  const allBilets = bilets ?? [];
  const sortedTopics = [...(topicProgress ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);

  const examPrediction = dashboard?.examPassPrediction ?? 0;
  const accuracy = Math.round(dashboard?.accuracyPercent ?? 0);
  const streak = dashboard?.currentStreak ?? 0;
  const totalAnswered = dashboard?.totalAnswered ?? 0;
  const totalCorrect = dashboard?.totalCorrect ?? 0;

  const panel = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: 24,
    borderRadius: 20,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    ...extra,
  });

  return (
    <div
      className="dp-root -m-4 md:-m-6"
      style={{
        minHeight: "100%",
        background: "#0a0a0f",
        color: "#e2e8f0",
        fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,240,255,.06) 0%,transparent 70%)", filter: "blur(80px)", animation: "dp-pulse1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%)", filter: "blur(100px)", animation: "dp-pulse2 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "40%", right: "20%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,.03) 0%,transparent 70%)", filter: "blur(60px)", animation: "dp-pulse1 14s ease-in-out infinite reverse" }} />
      </div>

      <div className="dp-container" style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div className="dp-header" style={{ animation: mounted ? "dp-fadeIn .6s ease" : "none" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <img src="/pravadrive-logo-horizontal.svg" alt="pravadrive" style={{ height: 40, width: "auto" }} />
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginLeft: 54 }}>
              Salom, <span style={{ color: "#94a3b8", fontWeight: 500 }}>{user?.email?.split("@")[0]}</span>! Bugun ham mashq qilamizmi?
            </p>
          </div>
          <div className="dp-header-btns">
            <button
              onClick={() => navigate("/subscription")}
              style={{
                padding: "10px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", cursor: "pointer",
                fontFamily: "inherit", transition: "all .3s",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,240,255,0.3)"; e.currentTarget.style.color = "#00f0ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 18, height: 18 }} />
              Obuna
            </button>
            <button
              disabled={!!starting}
              onClick={() => startFlow(4)}
              className="dp-exam-btn"
              style={{
                fontFamily: "inherit",
                cursor: starting ? "wait" : "pointer",
                opacity: starting === "4" ? 0.7 : 1,
              }}
            >
              ⚡ {starting === "4" ? "Yuklanmoqda..." : "Imtihon boshlash"}
            </button>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className="dp-stats-grid" style={{ animation: mounted ? "dp-slideUp .6s ease .1s both" : "none" }}>
          {([
            { label: "Imtihon ehtimoli", value: examPrediction, suffix: "%", color: "#00f0ff", icon: "/pravadrive-icon-otish-ehtimoli.svg", sub: examPrediction >= 70 ? "Zo'r natija!" : "Ko'proq mashq" },
            { label: "To'g'rilik darajasi", value: accuracy, suffix: "%", color: "#10b981", icon: "/pravadrive-icon-togrilik.svg", sub: `${totalAnswered} ta javob berildi` },
            { label: "To'g'ri javoblar", value: totalCorrect, suffix: "", color: "#8b5cf6", icon: "/pravadrive-icon-natijalarim.svg", sub: `${totalAnswered} ta savoldan` },
            { label: "Ketma-ket kunlar", value: streak, suffix: "", color: "#f59e0b", icon: "🔥", sub: `Rekord: ${dashboard?.longestStreak ?? 0} kun` },
          ] as const).map((card, i) => (
            <div
              key={i}
              style={{ padding: "20px 18px", borderRadius: 16, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "relative", overflow: "hidden", transition: "all .3s cubic-bezier(.4,0,.2,1)", cursor: "default" }}
              onMouseEnter={(e) => { e.currentTarget.style.border = `1px solid ${card.color}30`; e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}15`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,.06)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle,${card.color}08,transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{card.label}</span>
                {card.icon.startsWith("/") ? (
                  <img src={card.icon} alt="" style={{ width: 22, height: 22 }} />
                ) : (
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                )}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: card.color, marginBottom: 4, textShadow: `0 0 30px ${card.color}40`, fontFamily: "'JetBrains Mono', monospace" }}>
                <AnimatedNumber value={card.value} suffix={card.suffix} />
              </div>
              <span style={{ fontSize: 11, color: "#475569" }}>{card.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="dp-main-grid" style={{ animation: mounted ? "dp-slideUp .6s ease .2s both" : "none" }}>

          {/* ── Left panel ── */}
          <div style={panel({ padding: 26 })}>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, marginBottom: 26, padding: 4, borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", width: "fit-content" }}>
              {(["overview", "bilets", "topics"] as const).map((tab) => {
                const labels = { overview: "📊 Umumiy", bilets: "📋 Biletlar", topics: "📚 Mavzular" };
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "8px 18px", borderRadius: 9, border: active ? "1px solid rgba(0,240,255,.2)" : "1px solid transparent",
                      cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                      background: active ? "linear-gradient(135deg,rgba(0,240,255,.15),rgba(99,102,241,.15))" : "transparent",
                      color: active ? "#00f0ff" : "#64748b", transition: "all .25s",
                    }}
                  >{labels[tab]}</button>
                );
              })}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Haftalik faollik</h2>
                  <span style={{ fontSize: 11, color: "#64748b", padding: "4px 12px", borderRadius: 8, background: "rgba(255,255,255,.04)" }}>So'nggi 7 kun</span>
                </div>

                {/* Bar chart */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200, paddingBottom: 28, position: "relative" }}>
                  {/* Y-axis */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    {[100, 75, 50, 25, 0].map((v) => (
                      <span key={v} style={{ fontSize: 9, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{v}%</span>
                    ))}
                  </div>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((v) => (
                    <div key={v} style={{ position: "absolute", left: 28, right: 0, bottom: `${28 + (v / 100) * 160}px`, borderBottom: "1px solid rgba(255,255,255,.03)" }} />
                  ))}
                  {/* Bars */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flex: 1, marginLeft: 34, height: 160 }}>
                    {weeklyData.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: "100%", maxWidth: 40, borderRadius: 6,
                            height: d.correct > 0 ? `${(d.correct / 100) * 148}px` : "3px",
                            background: d.correct > 0 ? "linear-gradient(180deg,#00f0ff,#6366f1)" : "rgba(255,255,255,.06)",
                            boxShadow: d.correct > 0 ? "0 0 16px rgba(0,240,255,.15)" : "none",
                            transformOrigin: "bottom",
                            animation: `dp-bar .8s ease ${i * 0.07}s both`,
                            position: "relative", cursor: "default", transition: "filter .3s",
                          }}
                          onMouseEnter={(e) => d.correct > 0 && (e.currentTarget.style.filter = "brightness(1.3)")}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                        >
                          {d.correct > 0 && (
                            <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 600, color: "#00f0ff", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                              {d.correct}%
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: d.tests > 0 ? "#94a3b8" : "#475569", fontWeight: 500 }}>{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weak topics */}
                {(dashboard?.weakTopics ?? []).length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>Zaif mavzular</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {(dashboard?.weakTopics ?? []).slice(0, 4).map((topic, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: "#94a3b8" }}>{topic.topicName}</span>
                            <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>{topic.accuracyPercent.toFixed(0)}%</span>
                          </div>
                          <MiniBar value={topic.accuracyPercent} color="#ef4444" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!dashboard && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "#475569" }}>
                    <span style={{ fontSize: 40, marginBottom: 12 }}>📊</span>
                    <p style={{ fontSize: 13 }}>Hali statistika yo'q. Test boshlang!</p>
                  </div>
                )}
              </>
            )}

            {/* ── Biletlar tab ── */}
            {activeTab === "bilets" && (
              <>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>
                  Barcha biletlar
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 10 }}>{allBilets.length} ta</span>
                </h2>
                {allBilets.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, color: "#475569" }}>
                    <span style={{ fontSize: 40, marginBottom: 12 }}>📋</span>
                    <p style={{ fontSize: 13 }}>Hozircha faol biletlar yo'q</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, maxHeight: 460, overflowY: "auto", paddingRight: 2 }}>
                    {allBilets.map((bilet, i) => {
                      const color = bilet.isDemo ? "#6366f1" : "#00f0ff";
                      const key = `bilet-${bilet.id}`;
                      const isStarting = starting === key;
                      const hovered = hoveredBilet === bilet.id;
                      return (
                        <div
                          key={bilet.id}
                          onMouseEnter={() => setHoveredBilet(bilet.id)}
                          onMouseLeave={() => setHoveredBilet(null)}
                          onClick={() => !starting && startFlow(1, { biletId: bilet.id }, key)}
                          style={{
                            padding: "16px 18px", borderRadius: 12,
                            background: hovered ? `linear-gradient(135deg,${color}08,${color}12)` : "rgba(255,255,255,.02)",
                            border: `1px solid ${hovered ? color + "30" : "rgba(255,255,255,.05)"}`,
                            cursor: isStarting ? "wait" : starting ? "not-allowed" : "pointer",
                            transition: "all .3s ease",
                            transform: hovered && !starting ? "scale(1.01)" : "scale(1)",
                            animation: `dp-slideUp .5s ease ${i * 0.03}s both`,
                            opacity: starting && !isStarting ? 0.5 : 1,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{bilet.number}</span>
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>Bilet #{bilet.number}</div>
                                <div style={{ fontSize: 11, color: "#475569" }}>{bilet.questionCount} ta savol</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {bilet.isDemo && (
                                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: `${color}18`, color, textTransform: "uppercase" }}>Demo</span>
                              )}
                              {isTeacher && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setLinkBilet(bilet); }}
                                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, transition: "all .2s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.borderColor = "rgba(0,240,255,.3)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                                  title="Havola yaratish"
                                >🔗</button>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 5 }}>
                            {isStarting ? "⏳ Yuklanmoqda..." : "▶ Boshlash"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Mavzular tab ── */}
            {activeTab === "topics" && (
              <>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>
                  Mavzular bo'yicha progress
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 10 }}>{sortedTopics.length} ta</span>
                </h2>
                {sortedTopics.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, color: "#475569" }}>
                    <span style={{ fontSize: 40, marginBottom: 12 }}>📚</span>
                    <p style={{ fontSize: 13 }}>Hali mavzular bo'yicha statistika yo'q</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto", paddingRight: 2 }}>
                    {sortedTopics.map((topic, i) => {
                      const color = topicColor(topic.accuracyPercent);
                      return (
                        <div
                          key={topic.topicId}
                          onClick={() => !starting && startFlow(2, { topicIds: [topic.topicId] }, `topic-${topic.topicId}`)}
                          style={{
                            padding: "14px 18px", borderRadius: 12,
                            background: "rgba(255,255,255,.02)",
                            border: "1px solid rgba(255,255,255,.05)",
                            cursor: starting ? "not-allowed" : "pointer",
                            transition: "all .3s ease",
                            animation: `dp-slideUp .5s ease ${i * 0.03}s both`,
                            opacity: starting && starting !== `topic-${topic.topicId}` ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = color + "30"; e.currentTarget.style.boxShadow = `0 4px 16px ${color}10`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.05)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{topic.orderIndex}</span>
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0", lineHeight: 1.3 }}>{topic.topicName}</div>
                                <div style={{ fontSize: 10, color: "#475569" }}>{topic.totalAnswered} ta javob berildi</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              {topic.grade && topic.totalAnswered >= 5 && (
                                <span style={{ fontSize: 10, color, background: `${color}15`, padding: "2px 7px", borderRadius: 5 }}>{topic.grade}</span>
                              )}
                              {isTeacher && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setLinkTopic(topic); }}
                                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, transition: "all .2s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.borderColor = "rgba(0,240,255,.3)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                                  title="Havola yaratish"
                                >🔗</button>
                              )}
                              <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", minWidth: 40, textAlign: "right" }}>
                                {topic.accuracyPercent.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <MiniBar value={topic.accuracyPercent} color={color} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Readiness ring */}
            <div style={{ ...panel(), display: "flex", flexDirection: "column", alignItems: "center", animation: "dp-glow 4s ease-in-out infinite" }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Imtihon tayyorligi
              </h3>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <CircularProgress value={examPrediction} size={140} stroke={10} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#00f0ff", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 0 30px rgba(0,240,255,.4)" }}>
                    <AnimatedNumber value={examPrediction} suffix="%" />
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
                {examPrediction >= 80 ? "🎉 Ajoyib! Imtihonga tayyorsiz." : examPrediction >= 60 ? "💪 Yaxshi natija, davom eting!" : "📖 Ko'proq mashq qilish kerak"}
              </p>
            </div>

            {/* Quick actions */}
            <div style={panel()}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Tezkor harakatlar
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  { label: "Imtihon rejimi", icon: "/pravadrive-icon-imtihon.svg", color: "#ef4444", desc: "20 ta savol · 25 daqiqa", flowKey: "4", flowType: 4, teacherLabel: "Imtihon" },
                  { label: "Marafon", icon: "/pravadrive-icon-marafon.svg", color: "#f59e0b", desc: "Barcha faol savollar", flowKey: "5", flowType: 5, teacherLabel: "Marafon" },
                  { label: "Ixtiyoriy test", icon: "/pravadrive-icon-ixtiyoriy.svg", color: "#8b5cf6", desc: "Mavzularni tanlang", flowKey: "custom", flowType: 3 as const, teacherLabel: null },
                ] as const).map((action, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (starting) return;
                      if (action.flowKey === "custom") setCustomOpen(true);
                      else startFlow(action.flowType, undefined, action.flowKey);
                    }}
                    style={{
                      padding: "12px 14px", borderRadius: 11,
                      background: `linear-gradient(135deg,${action.color}06,${action.color}10)`,
                      border: `1px solid ${action.color}18`,
                      cursor: starting ? "not-allowed" : "pointer",
                      transition: "all .3s ease",
                      display: "flex", alignItems: "center", gap: 10,
                      opacity: starting && starting !== action.flowKey ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!starting) { e.currentTarget.style.borderColor = action.color + "35"; e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}15`; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = action.color + "18"; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <img src={action.icon} alt="" style={{ width: 28, height: 28, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#e2e8f0" }}>
                        {starting === action.flowKey ? "Yuklanmoqda..." : action.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{action.desc}</div>
                    </div>
                    {isTeacher && action.teacherLabel && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setLinkMode({ flowType: action.flowType, title: action.teacherLabel! }); }}
                        style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, transition: "all .2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.borderColor = "rgba(0,240,255,.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                        title="Havola yaratish"
                      >🔗</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent attempts */}
            {(dashboard?.recentAttempts ?? []).length > 0 && (
              <div style={panel()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>So'nggi urinishlar</h3>
                  <button onClick={() => navigate("/progress")} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Barchasi →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {(dashboard?.recentAttempts ?? []).slice(0, 4).map((attempt) => {
                    const sc = attemptStatusColor(attempt.status);
                    const sl = attemptStatusLabel(attempt.status);
                    const acc = attempt.correctCount != null ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100) : null;
                    return (
                      <div
                        key={attempt.id}
                        onClick={() => navigate(`/attempts/${attempt.id}`)}
                        style={{ padding: "10px 12px", borderRadius: 9, background: `${sc}06`, border: `1px solid ${sc}14`, cursor: "pointer", transition: "all .25s" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = sc + "30"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = sc + "14"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{attempt.flow}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
                              {attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleDateString("uz-UZ") : "—"}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            {acc !== null && <span style={{ fontSize: 12, color: sc, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{acc}%</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: `${sc}18`, color: sc }}>{sl}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <CustomTestDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        topics={activeTopics}
        onStart={(topicIds, count) => { setCustomOpen(false); startFlow(3, { topicIds, questionCount: count }, "3"); }}
        isStarting={starting === "3"}
      />
      {linkMode && (
        <CreateTestLinkDialog open onClose={() => setLinkMode(null)} defaultTitle={linkMode.title} flowType={linkMode.flowType} />
      )}
      {linkBilet && (
        <CreateTestLinkDialog open onClose={() => setLinkBilet(null)} defaultTitle={`Bilet #${linkBilet.number}`} flowType={1} biletId={linkBilet.id} />
      )}
      {linkTopic && (
        <CreateTestLinkDialog open onClose={() => setLinkTopic(null)} defaultTitle={linkTopic.topicName} flowType={2} topicIds={[linkTopic.topicId]} />
      )}

      {/* Subscription modal */}
      {subModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSubModal(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} />
          <div
            style={{
              position: "relative", zIndex: 1,
              background: "#111117", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 24, padding: 40, maxWidth: 380, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,.6)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSubModal(false)}
              style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >×</button>
            <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 56, height: 56, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Obuna kerak</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6 }}>
              Barcha test rejimlaridan foydalanish uchun faol obuna kerak
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setSubModal(false)}
                style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
              >Yopish</button>
              <button
                onClick={() => { setSubModal(false); navigate("/subscription"); }}
                style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: "#0a0a0f", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}
              >Obuna olish →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom test dialog ───────────────────────────────────────────────────────

function CustomTestDialog({ open, onClose, topics, onStart, isStarting }: {
  open: boolean;
  onClose: () => void;
  topics: TopicStudentDto[];
  onStart: (topicIds: string[], count: number) => void;
  isStarting: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(20);

  const toggleAll = () => setSelected(selected.length === topics.length ? [] : topics.map((t) => t.id));
  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const effectiveTopics = selected.length === 0 ? topics.map((t) => t.id) : selected;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ixtiyoriy test sozlamalari</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Mavzular</p>
              <button className="text-xs text-primary hover:underline" onClick={toggleAll}>
                {selected.length === topics.length ? "Barchasini olib tashlash" : "Barchasini tanlash"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0 ? "Hech biri tanlanmagan — barcha mavzulardan olinadi" : `${selected.length} ta mavzu tanlangan`}
            </p>
            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {topics.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer">
                  <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Savol soni</p>
              <span className="text-2xl font-bold text-primary">{count}</span>
            </div>
            <Slider min={5} max={100} step={5} value={[count]} onValueChange={([v]) => setCount(v)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>100</span></div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div>{effectiveTopics.length === topics.length ? "Barcha mavzular" : `${effectiveTopics.length} ta mavzu`} · {count} ta savol · Vaqt chegarasi yo'q</div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={() => onStart(effectiveTopics, count)} disabled={isStarting}>
            {isStarting ? "Yuklanmoqda..." : "Boshlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
