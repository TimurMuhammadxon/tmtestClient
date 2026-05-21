import { useQuery } from "@tanstack/react-query";
import { progressApi } from "@/api/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t, getFlowLabel } from "@/lib/i18n";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getGradeBadge(grade: string) {
  switch (grade) {
    case "A'lo": return <Badge variant="success">A'lo</Badge>;
    case "Yaxshi": return <Badge className="bg-blue-100 text-blue-800">Yaxshi</Badge>;
    case "Naqsh": return <Badge variant="warning">Takrorlash kerak</Badge>;
    case "Kritik": return <Badge variant="destructive">Kritik</Badge>;
    default: return <Badge variant="outline">{grade}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Passed": return <Badge variant="success">O'tdi</Badge>;
    case "Failed": return <Badge variant="destructive">O'tmadi</Badge>;
    case "Completed": return <Badge variant="secondary">Yakunlandi</Badge>;
    default: return <Badge variant="outline">Davom etmoqda</Badge>;
  }
}

export function ProgressPage() {
  const [historyPage, setHistoryPage] = useState(1);

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
        <p className="text-muted-foreground mt-1">Sizning o'quv natijalari</p>
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
                          {topic.correctCount}/{topic.totalAnswered} to'g'ri
                        </p>
                        <Progress
                          value={topic.accuracyPercent}
                          className="h-2 mt-2"
                        />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={cn(
                          "text-xl font-bold",
                          topic.accuracyPercent >= 85 ? "text-green-600" :
                          topic.accuracyPercent >= 65 ? "text-blue-600" :
                          topic.accuracyPercent >= 40 ? "text-yellow-600" : "text-red-600"
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
                <Card key={item.questionId}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xs">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.questionText}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.topicName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="text-xs">
                            {item.errorCount} xato
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.errorRatePercent.toFixed(0)}% xato
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
              {history && history.total > history.pageSize && (
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
                    {historyPage} / {Math.ceil(history.total / history.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => p + 1)}
                    disabled={historyPage >= Math.ceil(history.total / history.pageSize)}
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
    </div>
  );
}
