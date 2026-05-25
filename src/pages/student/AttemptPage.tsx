import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { attemptsApi } from "@/api/attempts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t, getFlowLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Flag } from "lucide-react";
import type { AttemptQuestionDto, SubmitAnswerResult } from "@/types";
import { toast } from "@/components/ui/use-toast";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AnswerState {
  chosenId: string;
  isCorrect: boolean;
  correctId: string;
}

export function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<{ status: string; correct: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ["attempt", id],
    queryFn: () => attemptsApi.get(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (attempt?.status !== "InProgress") {
      setFinished(true);
      if (attempt?.correctCount !== undefined && attempt?.correctCount !== null) {
        setFinishResult({
          status: attempt.status,
          correct: attempt.correctCount,
          total: attempt.totalQuestions,
        });
      }
    }
    if (attempt?.remainingSeconds !== undefined && attempt.remainingSeconds !== null) {
      setTimeLeft(attempt.remainingSeconds);
    }
    // Pre-populate answers from loaded state
    if (attempt?.questions) {
      const pre: Record<string, AnswerState> = {};
      for (const q of attempt.questions) {
        if (q.chosenAnswerId && q.isCorrect !== undefined && q.isCorrect !== null) {
          const correct = q.answers.find((a) => a.isCorrect)?.id ?? q.chosenAnswerId;
          pre[q.questionId] = {
            chosenId: q.chosenAnswerId,
            isCorrect: q.isCorrect,
            correctId: correct,
          };
        }
      }
      setAnswerStates(pre);
    }
  }, [attempt]);

  useEffect(() => {
    if (timeLeft === null || finished) return;
    if (timeLeft <= 0) {
      handleAutoFinish();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft, finished]);

  const answerMutation = useMutation({
    mutationFn: ({ questionId, answerId }: { questionId: string; answerId: string }) =>
      attemptsApi.answer(id!, questionId, answerId),
    onSuccess: (result: SubmitAnswerResult, vars) => {
      setAnswerStates((prev) => ({
        ...prev,
        [vars.questionId]: {
          chosenId: vars.answerId,
          isCorrect: result.isCorrect,
          correctId: result.correctAnswerId,
        },
      }));
      if (result.isFinished) {
        handleFinish();
      }
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Javob saqlanmadi. Qayta urinib ko'ring." });
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => attemptsApi.finish(id!),
    onSuccess: (result) => {
      setFinished(true);
      setFinishResult({ status: result.status, correct: result.correctCount, total: result.totalQuestions });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleAutoFinish = () => {
    if (!finished) finishMutation.mutate();
  };

  const handleFinish = () => {
    if (!finished) finishMutation.mutate();
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    if (answerStates[questionId] || finished) return;
    answerMutation.mutate({ questionId, answerId });
  };

  if (isLoading || !attempt) return <PageLoader />;

  const questions = attempt.questions;
  const currentQ: AttemptQuestionDto | undefined = questions[currentIndex];
  const answeredCount = Object.keys(answerStates).length;
  const progress = (answeredCount / questions.length) * 100;

  if (finished && finishResult) {
    const passed = finishResult.status === "Passed";
    const completed = finishResult.status === "Completed";
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center",
          passed ? "bg-green-100" : completed ? "bg-blue-100" : "bg-red-100"
        )}>
          {passed ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <XCircle className={cn("h-12 w-12", completed ? "text-blue-600" : "text-red-600")} />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {passed ? "Tabriklaymiz! 🎉" : completed ? "Yakunlandi" : "Muvaffaqiyatsiz 😔"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {finishResult.correct} / {finishResult.total} to'g'ri javob
          </p>
          <p className="text-3xl font-bold mt-3 text-primary">
            {Math.round((finishResult.correct / finishResult.total) * 100)}%
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/bilets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
          <Button className="flex-1" onClick={() => navigate("/dashboard")}>
            {t.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQ) return <PageLoader />;

  const currentAnswerState = answerStates[currentQ.questionId];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-muted-foreground">{getFlowLabel(attempt.flowType)}</span>
          <div className="text-lg font-semibold">
            {t.question} {currentIndex + 1} {t.of} {questions.length}
          </div>
        </div>
        {timeLeft !== null && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-semibold",
            timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">{answeredCount}/{questions.length} javoblandi</p>
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-1">
        {questions.map((q, i) => {
          const state = answerStates[q.questionId];
          return (
            <button
              key={q.questionId}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-7 h-7 rounded text-xs font-medium transition-colors",
                i === currentIndex && "ring-2 ring-primary ring-offset-1",
                state?.isCorrect === true && "bg-green-500 text-white",
                state?.isCorrect === false && "bg-red-500 text-white",
                !state && "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          {currentQ.imageKey && (
            <img
              src={`/api/storage/${currentQ.imageKey}`}
              alt="Savol rasmi"
              className="w-full max-h-48 object-contain rounded-lg bg-muted mb-3"
            />
          )}
          <p className="text-base font-medium leading-relaxed">{currentQ.text}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentQ.answers.map((answer) => {
            const chosen = currentAnswerState?.chosenId === answer.id;
            const isCorrectAnswer = currentAnswerState?.correctId === answer.id;
            const revealed = !!currentAnswerState;

            return (
              <button
                key={answer.id}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all text-sm",
                  !revealed && "hover:border-primary/50 hover:bg-primary/5 border-border",
                  revealed && isCorrectAnswer && "border-green-500 bg-green-50 text-green-900",
                  revealed && chosen && !isCorrectAnswer && "border-red-500 bg-red-50 text-red-900",
                  revealed && !chosen && !isCorrectAnswer && "border-border opacity-60",
                  answerMutation.isPending && "cursor-wait"
                )}
                onClick={() => handleAnswer(currentQ.questionId, answer.id)}
                disabled={revealed || finished}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                    !revealed && "border-muted-foreground/30",
                    revealed && isCorrectAnswer && "border-green-600 bg-green-600 text-white",
                    revealed && chosen && !isCorrectAnswer && "border-red-600 bg-red-600 text-white",
                    revealed && !chosen && !isCorrectAnswer && "border-muted-foreground/20",
                  )}>
                    {String.fromCharCode(65 + currentQ.answers.indexOf(answer))}
                  </span>
                  <span>{answer.text}</span>
                  {revealed && isCorrectAnswer && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto flex-shrink-0" />
                  )}
                  {revealed && chosen && !isCorrectAnswer && (
                    <XCircle className="h-4 w-4 text-red-600 ml-auto flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.prev}
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            {t.next}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={handleFinish}
            disabled={finishMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Flag className="h-4 w-4 mr-2" />
            {finishMutation.isPending ? t.loading : t.finish}
          </Button>
        )}
      </div>
    </div>
  );
}
