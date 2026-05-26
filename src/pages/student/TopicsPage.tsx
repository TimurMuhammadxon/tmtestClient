import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { topicsApi } from "@/api/topics";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { ChevronLeft, Link2 } from "lucide-react";
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
  const isTeacher = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const [starting, setStarting] = useState<string | null>(null);
  const [linkTopic, setLinkTopic] = useState<Topic | null>(null);

  const { data: topics, isLoading } = useQuery({
    queryKey: ["topics-student"],
    queryFn: topicsApi.list,
  });

  const { data: topicProgress } = useQuery({
    queryKey: ["progress-topics"],
    queryFn: progressApi.topics,
  });

  const progressMap = Object.fromEntries(
    (topicProgress ?? []).map((tp) => [tp.topicId, tp])
  );

  const startTopic = async (topicId: string) => {
    setStarting(topicId);
    try {
      const { id } = await attemptsApi.start({ flowType: 2, topicIds: [topicId] });
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Mavzular</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeTopics.length} ta mavzu · Mavzuni tanlang va mashq qiling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTopics.map((topic) => {
          const prog = progressMap[topic.id];
          const accuracy = prog?.accuracyPercent ?? 0;
          const answered = prog?.totalAnswered ?? 0;
          const isActive = starting === topic.id;
          const hasGrade = answered >= 5 && prog?.grade;

          return (
            <Card
              key={topic.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40",
                isActive && "opacity-70 pointer-events-none",
                !!starting && !isActive && "opacity-60"
              )}
              onClick={() => !starting && startTopic(topic.id)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{topic.orderIndex}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasGrade && (
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", gradeColor(prog!.grade))}>
                        {prog!.grade}
                      </span>
                    )}
                    {isTeacher && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); setLinkTopic(topic); }}
                        title="Havola yaratish"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="font-medium text-sm leading-snug line-clamp-2">{topic.name}</p>

                {answered > 0 ? (
                  <div className="space-y-1.5">
                    <Progress value={accuracy} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{answered} ta javob</span>
                      <span>{accuracy.toFixed(0)}% to'g'ri</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Hali o'rganilmagan</p>
                )}

                {isActive && (
                  <p className="text-xs text-primary font-medium">Yuklanmoqda...</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {linkTopic && (
        <CreateTestLinkDialog
          open={!!linkTopic}
          onClose={() => setLinkTopic(null)}
          defaultTitle={linkTopic.name}
          flowType={2}
          topicIds={[linkTopic.id]}
        />
      )}
    </div>
  );
}
