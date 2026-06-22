import { useQuery } from "@tanstack/react-query";
import { progressApi } from "@/api/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useTranslation, getFlowLabel } from "@/lib/i18n";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorQuestionDetailDto } from "@/types";

function useGradeBadge() {
  const t = useTranslation();
  return (grade: string) => {
    switch (grade) {
      case "A'lo": return <Badge variant="success">{t.excellent}</Badge>;
      case "Yaxshi": return <Badge className="bg-blue-950/60 text-blue-400 border-blue-800/50">{t.good}</Badge>;
      case "Naqsh": return <Badge variant="warning">{t.needRepeat}</Badge>;
      case "Kritik": return <Badge variant="destructive">{t.critical}</Badge>;
      default: return <Badge variant="outline">{grade}</Badge>;
    }
  };
}

function useStatusBadge() {
  const t = useTranslation();
  return (status: string) => {
    switch (status) {
      case "Passed": return <Badge variant="success">{t.statusPassed}</Badge>;
      case "Failed": return <Badge variant="destructive">{t.statusFailed}</Badge>;
      case "Completed": return <Badge variant="secondary">{t.statusCompleted}</Badge>;
      default: return <Badge variant="outline">{t.inProgress}</Badge>;
    }
  };
}

export function ProgressPage() {
  const t = useTranslation();
  const getGradeBadge = useGradeBadge();
  const getStatusBadge = useStatusBadge();
  const [historyPage, setHistoryPage] = useState(1);
  const [errorDetail, setErrorDetail] = useState<ErrorQuestionDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openErrorDetail = async (questionId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await progressApi.errorDetail(questionId);
      setErrorDetail(detail);
    } finally {
      setLoadingDetail(false);
    }
  };

  const { data: topics, isLoading: loadingTopics } = useQuery({
    queryKey: ["progress-topics"],
    queryFn: progressApi.topics,
  });

  const { data: errors, isLoading: loadingErrors } = useQuery({
    queryKey: ["progress-errors"],
    queryFn: progressApi.errors,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["progress-history", historyPage],
    queryFn: () => progressApi.history({ page: historyPage, pageSize: 20 }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.progress}</h1>
        <p className="text-muted-foreground mt-1">{t.yourResults}</p>
      </div>

      <Tabs defaultValue="topics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">{t.topicsProgress}</TabsTrigger>
          <TabsTrigger value="errors">{t.errorsAnalysis}</TabsTrigger>
          <TabsTrigger value="history">{t.history}</TabsTrigger>
        </TabsList>

        {/* Topics */}
        <TabsContent value="topics">
          {loadingTopics ? (
            <PageLoader />
          ) : (
            <div className="space-y-3">
              {topics?.map((topic) => (
                <Card key={topic.topicId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{topic.topicName}</span>
                          {getGradeBadge(topic.grade)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {topic.correctCount}/{topic.totalAnswered} {t.correctShort}
                        </p>
                        <Progress
                          value={topic.accuracyPercent}
                          className="h-2 mt-2"
                        />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={cn(
                          "text-xl font-bold",
                          topic.accuracyPercent >= 85 ? "text-emerald-400" :
                          topic.accuracyPercent >= 65 ? "text-cyan-400" :
                          topic.accuracyPercent >= 40 ? "text-amber-400" : "text-red-400"
                        )}>
                          {topic.accuracyPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {topics?.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    Hali mavzular bo'yicha ma'lumot yo'q
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Errors */}
        <TabsContent value="errors">
          {loadingErrors ? (
            <PageLoader />
          ) : (
            <div className="space-y-3">
              {errors?.map((item, i) => (
                <Card
                  key={item.questionId}
                  className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
                  onClick={() => openErrorDetail(item.questionId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <span className="font-bold text-xs" style={{ color: "#f87171" }}>{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.questionText}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.topicName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="text-xs">
                            {item.errorCount} {t.mistakes}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.errorRatePercent.toFixed(0)}% {t.mistakes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {errors?.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    Hali xatolar yo'q 🎉
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          {loadingHistory ? (
            <PageLoader />
          ) : (
            <div className="space-y-3">
              {history?.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{getFlowLabel(item.flow)}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.finishedAt
                          ? format(new Date(item.finishedAt), "dd.MM.yyyy HH:mm")
                          : format(new Date(item.startedAt), "dd.MM.yyyy HH:mm")}
                      </p>
                    </div>
                    {item.correctCount !== null && item.correctCount !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {item.correctCount}/{item.totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((item.correctCount / item.totalQuestions) * 100)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {history && history.totalCount > history.pageSize && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {historyPage} / {Math.ceil(history.totalCount / history.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => p + 1)}
                    disabled={historyPage >= Math.ceil(history.totalCount / history.pageSize)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {history?.items.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    Hali test topshirilmagan
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Error question detail modal */}
      <Dialog open={!!errorDetail || loadingDetail} onOpenChange={(o) => { if (!o) { setErrorDetail(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {loadingDetail && !errorDetail ? (
            <div className="flex items-center justify-center py-12"><PageLoader /></div>
          ) : errorDetail && (
            <>
              <DialogHeader>
                <p className="text-xs text-muted-foreground mb-1">{errorDetail.topicName}</p>
                <DialogTitle className="text-base leading-relaxed">{errorDetail.questionText}</DialogTitle>
              </DialogHeader>

              {errorDetail.imageUrl && (
                <img src={errorDetail.imageUrl} alt="" className="w-full max-h-56 object-contain rounded-lg bg-muted" />
              )}

              <div className="space-y-2 mt-2">
                {errorDetail.answers.map((answer, i) => {
                  const isCorrect = answer.isCorrect;
                  const isChosen = errorDetail.lastChosenAnswerId === answer.id;
                  return (
                    <div
                      key={answer.id}
                      className={cn(
                        "p-4 rounded-lg border-2 text-sm",
                        isCorrect && "border-emerald-500/50 bg-emerald-950/30 text-emerald-300",
                        isChosen && !isCorrect && "border-red-500/50 bg-red-950/30 text-red-300",
                        !isCorrect && !isChosen && "border-border opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                          isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                          isChosen && !isCorrect && "border-red-600 bg-red-600 text-white",
                          !isCorrect && !isChosen && "border-muted-foreground/20"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{answer.text}</span>
                        {isCorrect && <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                        {isChosen && !isCorrect && <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errorDetail.explanation && (
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">{t.correct}:</p>
                  <p className="text-sm text-muted-foreground">{errorDetail.explanation}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
