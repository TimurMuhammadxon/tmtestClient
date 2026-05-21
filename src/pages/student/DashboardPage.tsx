import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { progressApi } from "@/api/progress";
import { attemptsApi } from "@/api/attempts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t, getFlowLabel } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth";
import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Play,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import type { RecentAttemptDto } from "@/types";

function getStatusBadge(status: string) {
  switch (status) {
    case "Passed": return <Badge variant="success">O'tdi</Badge>;
    case "Failed": return <Badge variant="destructive">O'tmadi</Badge>;
    case "Completed": return <Badge variant="secondary">Yakunlandi</Badge>;
    default: return <Badge variant="outline">Davom etmoqda</Badge>;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
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
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{getFlowLabel(attempt.flow)}</span>
          <span className="text-xs text-muted-foreground">
            {attempt.finishedAt ? format(new Date(attempt.finishedAt), "dd.MM.yyyy") : "—"}
          </span>
        </div>
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

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: progressApi.dashboard,
  });

  const startExam = async () => {
    const { id } = await attemptsApi.start({ flowType: 4 });
    navigate(`/attempts/${id}`);
  };

  const startMarathon = async () => {
    const { id } = await attemptsApi.start({ flowType: 5 });
    navigate(`/attempts/${id}`);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Salom, {user?.email?.split("@")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Bugun ham mashq qilamizmi?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          className="flex flex-col h-20 gap-1"
          onClick={() => navigate("/bilets")}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs">{t.bilets}</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-20 gap-1"
          onClick={startExam}
        >
          <Target className="h-5 w-5" />
          <span className="text-xs">{t.flowExam}</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-20 gap-1"
          onClick={startMarathon}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs">{t.flowMarathon}</span>
        </Button>
        <Button
          variant="secondary"
          className="flex flex-col h-20 gap-1"
          onClick={() => navigate("/progress")}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs">{t.progress}</span>
        </Button>
      </div>

      {/* Stats */}
      {dashboard && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Flame}
              label={t.currentStreak}
              value={`${dashboard.currentStreak} ${t.days}`}
              color="text-orange-500"
            />
            <StatCard
              icon={Trophy}
              label={t.level}
              value={dashboard.level}
              color="text-yellow-500"
            />
            <StatCard
              icon={Target}
              label={t.accuracy}
              value={`${dashboard.accuracyPercent.toFixed(1)}%`}
              color="text-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label={t.examPrediction}
              value={`${dashboard.examPassPrediction}%`}
              color="text-blue-500"
            />
          </div>

          {/* Exam prediction bar */}
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

          {/* Weak topics */}
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

          {/* Recent attempts */}
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
              Hali test topshirilmagan. Birinchi testni boshlash uchun yuqoridagi tugmalardan birini bosing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
