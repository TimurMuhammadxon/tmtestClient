import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { attemptsApi } from "@/api/attempts";
import { topicsApi, type TopicStudentDto } from "@/api/topics";
import { progressApi } from "@/api/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Target, Zap, Shuffle, Play, Clock, CheckCircle2, BookOpen } from "lucide-react";

function gradeColor(grade: string) {
  switch (grade) {
    case "A'lo":    return "text-emerald-400";
    case "Yaxshi":  return "text-cyan-400";
    case "Takrorlash kerak": return "text-amber-400";
    case "Kritik":  return "text-red-400";
    default:        return "text-muted-foreground";
  }
}

export function PracticePage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [starting, setStarting] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const { data: topics, isLoading: loadingTopics } = useQuery({ queryKey: ["topics-student"], queryFn: topicsApi.list });
  const { data: topicProgress } = useQuery({ queryKey: ["progress-topics"], queryFn: progressApi.topics });
  const progressMap = Object.fromEntries((topicProgress ?? []).map((tp) => [tp.topicId, tp]));

  const startFlow = async (flowType: number, extra?: { topicIds?: string[]; questionCount?: number }) => {
    const key = String(flowType);
    setStarting(key);
    try {
      const { id } = await attemptsApi.start({ flowType, ...extra });
      navigate(`/attempts/${id}`);
    } finally { setStarting(null); }
  };

  const startTopic = async (topicId: string) => {
    setStarting(topicId);
    try {
      const { id } = await attemptsApi.start({ flowType: 2, topicIds: [topicId] });
      navigate(`/attempts/${id}`);
    } finally { setStarting(null); }
  };

  if (loadingTopics) return <PageLoader />;
  const activeTopics = (topics ?? []).filter((tp) => !tp.isDemo);

  const MODES = [
    { id: "exam", icon: Target, title: t.examMode, description: t.examModeDesc, color: "text-red-400", bg: "bg-red-950/20 border-red-900/30", badge: t.badgeOfficial, badgeColor: "bg-red-950/40 text-red-400" },
    { id: "marathon", icon: Zap, title: t.marathon, description: t.marathonDesc, color: "text-amber-400", bg: "bg-amber-950/20 border-amber-900/30", badge: t.badgeUnlimited, badgeColor: "bg-amber-950/40 text-amber-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.practice}</h1>
        <p className="text-muted-foreground mt-1">{t.selectModeStart}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.quickModes}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODES.map((m) => (
            <Card key={m.id} className={cn("border", m.bg)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <m.icon className={cn("h-8 w-8", m.color)} />
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", m.badgeColor)}>{m.badge}</span>
                </div>
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                </div>
                <Button className="w-full" size="sm" variant={m.id === "exam" ? "default" : "outline"} onClick={() => startFlow(m.id === "exam" ? 4 : 5)} disabled={starting === (m.id === "exam" ? "4" : "5")}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {starting === (m.id === "exam" ? "4" : "5") ? t.loading : t.start}
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="border bg-violet-50 border-violet-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <Shuffle className="h-8 w-8 text-violet-500" />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{t.badgeCustomizable}</span>
              </div>
              <div>
                <p className="font-semibold">{t.customTest}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.customTestDesc}</p>
              </div>
              <Button className="w-full" size="sm" variant="outline" onClick={() => setCustomOpen(true)}>
                <Shuffle className="h-3.5 w-3.5 mr-1.5" />
                {t.configure}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.byTopic} ({activeTopics.length})</h2>
        <div className="space-y-2">
          {activeTopics.map((topic) => {
            const prog = progressMap[topic.id];
            const accuracy = prog?.accuracyPercent ?? 0;
            const answered = prog?.totalAnswered ?? 0;
            const isActive = starting === topic.id;
            return (
              <Card key={topic.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">{topic.orderIndex}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{topic.name}</p>
                        {answered >= 5 && <span className={cn("text-xs font-medium flex-shrink-0", gradeColor(prog?.grade ?? ""))}>{prog?.grade}</span>}
                      </div>
                      {answered > 0 ? (
                        <div className="flex items-center gap-2">
                          <Progress value={accuracy} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground flex-shrink-0">{accuracy.toFixed(0)}% · {answered}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t.notStudiedYet}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startTopic(topic.id)} disabled={!!starting} className="flex-shrink-0">
                      {isActive ? "..." : <><Play className="h-3.5 w-3.5 mr-1" />{t.start}</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <CustomTestDialog open={customOpen} onClose={() => setCustomOpen(false)} topics={activeTopics} onStart={(topicIds, count) => { setCustomOpen(false); startFlow(3, { topicIds, questionCount: count }); }} isStarting={starting === "3"} />
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
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /><span>{effectiveTopics.length === topics.length ? t.allTopics : `${effectiveTopics.length} ${t.selectedCount}`}</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /><span>{count} {t.questionsCount}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{t.noTimeLimit}</span></div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={() => onStart(effectiveTopics, count)} disabled={isStarting}>
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? t.loading : t.start}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
