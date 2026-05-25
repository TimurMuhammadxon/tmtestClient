import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { topicsApi, type TopicStudentDto } from "@/api/topics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { t, getFlowLabel } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import {
  Flame, Trophy, Target, TrendingUp, BookOpen, Play, AlertTriangle,
  Zap, Shuffle, Map, Clock, CheckCircle2, Link2,
} from "lucide-react";
import { format } from "date-fns";
import type { RecentAttemptDto } from "@/types";

// ─── Mode cards ──────────────────────────────────────────────────────────────

const MODES = [
  {
    id: "topics",
    icon: Map,
    title: "Mavzular",
    description: "Mavzu bo'yicha savollar · rivojlanishni kuzating",
    color: "text-sky-500",
    bg: "bg-sky-50 border-sky-100",
    badge: "Tavsiya",
    badgeColor: "bg-sky-100 text-sky-700",
    action: "navigate" as const,
    to: "/topics",
  },
  {
    id: "bilets",
    icon: BookOpen,
    title: "Biletlar",
    description: "Rasmiy biletlar bo'yicha savollar",
    color: "text-green-500",
    bg: "bg-green-50 border-green-100",
    badge: "100 ta",
    badgeColor: "bg-green-100 text-green-700",
    action: "navigate" as const,
    to: "/bilets",
  },
  {
    id: "exam",
    icon: Target,
    title: "Imtihon",
    description: "20 ta savol · 25 daqiqa · 3 xato = rad",
    color: "text-red-500",
    bg: "bg-red-50 border-red-100",
    badge: "Rasmiy",
    badgeColor: "bg-red-100 text-red-700",
    action: "start" as const,
    flowType: 4,
  },
  {
    id: "marathon",
    icon: Zap,
    title: "Marafon",
    description: "Barcha faol savollar · vaqt chegarasi yo'q",
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-100",
    badge: "Cheksiz",
    badgeColor: "bg-orange-100 text-orange-700",
    action: "start" as const,
    flowType: 5,
  },
  {
    id: "custom",
    icon: Shuffle,
    title: "Ixtiyoriy",
    description: "Mavzularni tanlang · savol sonini belgilang",
    color: "text-violet-500",
    bg: "bg-violet-50 border-violet-100",
    badge: "Sozlanadi",
    badgeColor: "bg-violet-100 text-violet-700",
    action: "dialog" as const,
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "Passed":    return <Badge variant="success">O'tdi</Badge>;
    case "Failed":    return <Badge variant="destructive">O'tmadi</Badge>;
    case "Completed": return <Badge variant="secondary">Yakunlandi</Badge>;
    default:          return <Badge variant="outline">Davom etmoqda</Badge>;
  }
}

function StatCard({
  icon: Icon, label, value, color = "text-primary",
}: {
  icon: React.ElementType; label: string; value: string | number; color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`${color} bg-current/10 rounded-xl p-3`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AttemptRow({ attempt }: { attempt: RecentAttemptDto }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 px-2 rounded-md transition-colors"
      onClick={() => navigate(`/attempts/${attempt.id}`)}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium">{getFlowLabel(attempt.flow)}</span>
        <span className="text-xs text-muted-foreground">
          {attempt.finishedAt ? format(new Date(attempt.finishedAt), "dd.MM.yyyy") : "—"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {attempt.correctCount !== null && attempt.correctCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {attempt.correctCount}/{attempt.totalQuestions}
          </span>
        )}
        {getStatusBadge(attempt.status)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore();
  const isTeacher = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const navigate = useNavigate();
  const [starting, setStarting] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<{ flowType: number; title: string } | null>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: progressApi.dashboard,
  });

  const { data: topics } = useQuery({
    queryKey: ["topics-student"],
    queryFn: topicsApi.list,
  });

  const startFlow = async (flowType: number, extra?: { topicIds?: string[]; questionCount?: number }) => {
    const key = String(flowType);
    setStarting(key);
    try {
      const { id } = await attemptsApi.start({ flowType, ...extra });
      navigate(`/attempts/${id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Test boshlanmadi. Qayta urinib ko'ring." });
    } finally {
      setStarting(null);
    }
  };

  if (isLoading) return <PageLoader />;

  const activeTopics = (topics ?? []).filter((t) => !t.isDemo);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Salom, {user?.email?.split("@")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Bugun ham mashq qilamizmi?</p>
      </div>

      {/* ── Mode cards ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Rejimni tanlang
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MODES.map((m) => {
            const isLoading = m.action === "start" && starting === String(m.flowType);
            return (
              <Card
                key={m.id}
                className={cn(
                  "border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
                  m.bg
                )}
                onClick={() => {
                  if (m.action === "navigate") navigate(m.to);
                  else if (m.action === "dialog") setCustomOpen(true);
                  else if (m.action === "start" && !starting) startFlow(m.flowType);
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <m.icon className={cn("h-7 w-7", m.color)} />
                    <div className="flex items-center gap-1">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", m.badgeColor)}>
                        {m.badge}
                      </span>
                      {isTeacher && m.action === "start" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkMode({ flowType: m.flowType, title: m.title });
                          }}
                          title="Havola yaratish"
                        >
                          <Link2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.description}</p>
                  </div>
                  {m.action === "start" && (
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                      <Play className="h-3 w-3" />
                      {isLoading ? "Yuklanmoqda..." : "Boshlash"}
                    </div>
                  )}
                  {m.action === "navigate" && (
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                      <Play className="h-3 w-3" />
                      O'tish
                    </div>
                  )}
                  {m.action === "dialog" && (
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                      <Shuffle className="h-3 w-3" />
                      Sozlash
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Stats ── */}
      {dashboard && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Flame} label={t.currentStreak} value={`${dashboard.currentStreak} ${t.days}`} color="text-orange-500" />
            <StatCard icon={Trophy} label={t.level} value={dashboard.level} color="text-yellow-500" />
            <StatCard icon={Target} label={t.accuracy} value={`${dashboard.accuracyPercent.toFixed(1)}%`} color="text-green-500" />
            <StatCard icon={TrendingUp} label={t.examPrediction} value={`${dashboard.examPassPrediction}%`} color="text-blue-500" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Imtihon o'tish ehtimoli</span>
                <span className="text-primary">{dashboard.examPassPrediction}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={dashboard.examPassPrediction} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Jami {dashboard.totalAnswered} ta savolga javob berildi, {dashboard.totalCorrect} ta to'g'ri
              </p>
            </CardContent>
          </Card>

          {dashboard.weakTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {t.weakTopics}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.weakTopics.map((topic) => (
                  <div key={topic.topicId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{topic.topicName}</span>
                      <span className="text-muted-foreground">{topic.accuracyPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={topic.accuracyPercent} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {dashboard.recentAttempts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.recentAttempts}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/progress")}>
                  Barchasi
                </Button>
              </CardHeader>
              <CardContent className="divide-y">
                {dashboard.recentAttempts.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!dashboard && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Play className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Hali test topshirilmagan. Yuqoridagi rejimlardan birini tanlang.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Custom dialog ── */}
      <CustomTestDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        topics={activeTopics}
        onStart={(topicIds, count) => {
          setCustomOpen(false);
          startFlow(3, { topicIds, questionCount: count });
        }}
        isStarting={starting === "3"}
      />

      {linkMode && (
        <CreateTestLinkDialog
          open={!!linkMode}
          onClose={() => setLinkMode(null)}
          defaultTitle={linkMode.title}
          flowType={linkMode.flowType}
        />
      )}
    </div>
  );
}

// ─── Custom test dialog ───────────────────────────────────────────────────────

function CustomTestDialog({
  open, onClose, topics, onStart, isStarting,
}: {
  open: boolean;
  onClose: () => void;
  topics: TopicStudentDto[];
  onStart: (topicIds: string[], count: number) => void;
  isStarting: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(20);

  const toggleAll = () => {
    setSelected(selected.length === topics.length ? [] : topics.map((t) => t.id));
  };

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

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
              {selected.length === 0
                ? "Hech biri tanlanmagan — barcha mavzulardan olinadi"
                : `${selected.length} ta mavzu tanlangan`}
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span><span>100</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{effectiveTopics.length === topics.length ? "Barcha mavzular" : `${effectiveTopics.length} ta mavzu`}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>{count} ta savol</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Vaqt chegarasi yo'q</span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={() => onStart(effectiveTopics, count)} disabled={isStarting}>
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? "Yuklanmoqda..." : "Boshlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
