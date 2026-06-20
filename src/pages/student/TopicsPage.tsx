import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { topicsApi } from "@/api/topics";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { subscriptionsApi } from "@/api/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronLeft, Link2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

function gradeColor(grade: string) {
  switch (grade) {
    case "A'lo":               return "text-emerald-400 bg-emerald-950/30";
    case "Yaxshi":             return "text-cyan-400 bg-cyan-950/30";
    case "Takrorlash kerak":   return "text-amber-400 bg-amber-950/30";
    case "Kritik":             return "text-red-400 bg-red-950/30";
    default:                   return "text-muted-foreground bg-muted";
  }
}

type Topic = { id: string; name: string; orderIndex: number; isDemo: boolean };

export function StudentTopicsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const t = useTranslation();
  const isPrivileged = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const isTeacher = isPrivileged;
  const [starting, setStarting] = useState<string | null>(null);
  const [linkTopic, setLinkTopic] = useState<Topic | null>(null);
  const [subModal, setSubModal] = useState(false);

  const { data: topics, isLoading } = useQuery({ queryKey: ["topics-student"], queryFn: topicsApi.list });
  const { data: topicProgress } = useQuery({ queryKey: ["progress-topics"], queryFn: progressApi.topics });
  const { data: subscription } = useQuery({ queryKey: ["my-subscription"], queryFn: subscriptionsApi.getMy, enabled: !isPrivileged, retry: false });
  const hasAccess = isPrivileged || subscription?.isActive === true;
  const progressMap = Object.fromEntries((topicProgress ?? []).map((tp) => [tp.topicId, tp]));

  const startTopic = async (topic: Topic) => {
    if (!topic.isDemo && !hasAccess) { setSubModal(true); return; }
    setStarting(topic.id);
    try {
      const { id } = await attemptsApi.start({ flowType: 2, topicIds: [topic.id] });
      navigate(`/attempts/${id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? t.testFailed });
    } finally { setStarting(null); }
  };

  if (isLoading) return <PageLoader />;
  const activeTopics = (topics ?? []).filter((tp) => !tp.isDemo);
  const demoTopics = (topics ?? []).filter((tp) => tp.isDemo);

  const renderTopicCard = (topic: Topic) => {
    const prog = progressMap[topic.id];
    const accuracy = prog?.accuracyPercent ?? 0;
    const answered = prog?.totalAnswered ?? 0;
    const isActive = starting === topic.id;
    const hasGrade = answered >= 5 && prog?.grade;
    const locked = !topic.isDemo && !hasAccess;

    return (
      <Card key={topic.id} className={cn("cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5", locked ? "hover:border-amber-500/30" : "hover:border-primary/40", isActive && "opacity-70 pointer-events-none", !!starting && !isActive && "opacity-60")} onClick={() => !starting && startTopic(topic)}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", locked ? "bg-amber-500/10" : "bg-primary/10")}>
              <span className={cn("text-sm font-bold", locked ? "text-amber-500" : "text-primary")}>{topic.orderIndex}</span>
            </div>
            <div className="flex items-center gap-1">
              {topic.isDemo && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Demo</span>}
              {hasGrade && !topic.isDemo && <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", gradeColor(prog!.grade))}>{prog!.grade}</span>}
              {isTeacher && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setLinkTopic(topic); }} title={t.createLink}>
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <p className="font-medium text-sm leading-snug line-clamp-2">{topic.name}</p>
          {answered > 0 && !locked ? (
            <div className="space-y-1.5">
              <Progress value={accuracy} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{answered} {t.answered}</span>
                <span>{accuracy.toFixed(0)}% {t.correctShort}</span>
              </div>
            </div>
          ) : (
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", locked ? "text-amber-500" : "text-muted-foreground")}>
              {locked ? <><Lock className="h-3 w-3" /><span>{t.subscriptionRequired}</span></> : <span>{t.notStudiedYet}</span>}
            </div>
          )}
          {isActive && <p className="text-xs text-primary font-medium">{t.loading}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ChevronLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{t.topics}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeTopics.length} {t.topics} · {t.selectTopic}</p>
        </div>
      </div>

      {demoTopics.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.demoTopics}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{demoTopics.map(renderTopicCard)}</div>
        </section>
      )}

      {activeTopics.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.allTopics} ({activeTopics.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{activeTopics.map(renderTopicCard)}</div>
        </section>
      )}

      {linkTopic && <CreateTestLinkDialog open={!!linkTopic} onClose={() => setLinkTopic(null)} defaultTitle={linkTopic.name} flowType={2} topicIds={[linkTopic.id]} />}

      {subModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} onClick={() => setSubModal(false)}>
          <div style={{ background: "#111117", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 40, maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.6)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 56, height: 56, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8, fontFamily: "inherit" }}>{t.subscriptionRequired}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6, fontFamily: "inherit" }}>{t.subRequiredTopic}</p>
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
