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
import {
  CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Flag, AlertTriangle,
} from "lucide-react";
import type { AttemptQuestionDto, SubmitAnswerResult } from "@/types";
import { toast } from "@/components/ui/use-toast";

const EXAM_FLOW = "Exam";
// delay before auto-advancing to next question (ms)
const CORRECT_ADVANCE_DELAY = 600;
const EXAM_ADVANCE_DELAY = 500;

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

interface FinishResultState {
  status: string;
  correct: number;
  total: number;
  wrongCount: number;
}

export function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<FinishResultState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ["attempt", id],
    queryFn: () => attemptsApi.get(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  // Restore state when loading a previously started attempt
  useEffect(() => {
    if (!attempt) return;
    if (attempt.status !== "InProgress") {
      setFinished(true);
      if (attempt.correctCount !== undefined && attempt.correctCount !== null) {
        setFinishResult({
          status: attempt.status,
          correct: attempt.correctCount,
          total: attempt.totalQuestions,
          wrongCount: 0,
        });
      }
    } else {
      setFinished(false);
    }
    if (attempt.remainingSeconds !== undefined && attempt.remainingSeconds !== null) {
      setTimeLeft(attempt.remainingSeconds);
    }
    if (attempt.questions) {
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

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || finished) return;
    if (timeLeft <= 0) {
      if (!finished) finishMutation.mutate();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isExam = attempt?.flowType === EXAM_FLOW;
  const isMarathon = attempt?.flowType === "Marathon";

  const finishMutation = useMutation({
    mutationFn: () => attemptsApi.finish(id!),
    onSuccess: (result) => {
      const wc = Object.values(answerStates).filter((s) => !s.isCorrect).length;
      setFinished(true);
      setFinishResult({
        status: result.status,
        correct: result.correctCount,
        total: result.totalQuestions,
        wrongCount: wc,
      });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const answerMutation = useMutation({
    mutationFn: ({ questionId, answerId }: { questionId: string; answerId: string }) =>
      attemptsApi.answer(id!, questionId, answerId),
    onSuccess: (result: SubmitAnswerResult, vars) => {
      // Update answer state first
      setAnswerStates((prev) => ({
        ...prev,
        [vars.questionId]: {
          chosenId: vars.answerId,
          isCorrect: result.isCorrect,
          correctId: result.correctAnswerId,
        },
      }));

      // Backend auto-finished the attempt (exam 3-mistake rule)
      if (result.isFinished) {
        const prevWrong = Object.values(answerStates).filter((s) => !s.isCorrect).length;
        setFinished(true);
        setFinishResult({
          status: result.status,
          correct: result.correctCount ?? 0,
          total: result.totalQuestions,
          wrongCount: prevWrong + (result.isCorrect ? 0 : 1),
        });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        return;
      }

      const questions = attempt!.questions;
      const isLast = currentIndex === questions.length - 1;

      if (isExam) {
        // Exam: always auto-advance after any answer
        autoAdvanceRef.current = setTimeout(() => {
          if (isLast) {
            finishMutation.mutate();
          } else {
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
          }
        }, EXAM_ADVANCE_DELAY);
      } else {
        // Normal modes: auto-advance only on correct answer
        if (result.isCorrect) {
          autoAdvanceRef.current = setTimeout(() => {
            if (isLast) {
              finishMutation.mutate();
            } else {
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
            }
          }, CORRECT_ADVANCE_DELAY);
        }
        // Wrong answer: stay on question so user can see correct answer
      }
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ??
        (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Javob saqlanmadi. Qayta urinib ko'ring." });
    },
  });

  const handleAnswer = (questionId: string, answerId: string) => {
    if (answerStates[questionId] || finished || answerMutation.isPending) return;
    // Clear any pending auto-advance from previous answer before submitting new one
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    answerMutation.mutate({ questionId, answerId });
  };

  // Manual navigation — cancels any pending auto-advance
  const goTo = (index: number) => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setCurrentIndex(index);
  };

  const handleFinish = () => {
    if (finished || finishMutation.isPending) return;
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    finishMutation.mutate();
  };

  if (isLoading || !attempt) return <PageLoader />;

  const questions = attempt.questions;
  const currentQ: AttemptQuestionDto | undefined = questions[currentIndex];
  const answeredCount = Object.keys(answerStates).length;
  const progress = (answeredCount / questions.length) * 100;
  const wrongCount = Object.values(answerStates).filter((s) => !s.isCorrect).length;

  // ─── Finish screen ─────────────────────────────────────────────────────────
  if (finished && finishResult) {
    const passed = finishResult.status === "Passed";
    const failed = finishResult.status === "Failed";
    const completed = finishResult.status === "Completed";
    const examFail3Mistakes = failed && finishResult.wrongCount >= 3;

    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: passed
              ? "rgba(16,185,129,0.15)"
              : completed
              ? "rgba(59,130,246,0.15)"
              : "rgba(239,68,68,0.15)",
            border: `2px solid ${
              passed
                ? "rgba(16,185,129,0.3)"
                : completed
                ? "rgba(59,130,246,0.3)"
                : "rgba(239,68,68,0.3)"
            }`,
            boxShadow: `0 0 30px ${
              passed
                ? "rgba(16,185,129,0.2)"
                : completed
                ? "rgba(59,130,246,0.2)"
                : "rgba(239,68,68,0.2)"
            }`,
          }}
        >
          {passed ? (
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          ) : (
            <XCircle className={cn("h-12 w-12", completed ? "text-blue-400" : "text-red-400")} />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">
            {passed
              ? "Tabriklaymiz! O'tdingiz 🎉"
              : completed
              ? "Test yakunlandi"
              : examFail3Mistakes
              ? "Imtihon rad etildi 😔"
              : "Muvaffaqiyatsiz 😔"}
          </h2>

          {examFail3Mistakes && (
            <p className="text-sm font-medium text-red-400">
              3 ta xato qilindingiz — imtihon tugadi
            </p>
          )}
          {failed && !examFail3Mistakes && (
            <p className="text-sm text-muted-foreground">
              O'tish uchun kamida 18/20 to'g'ri javob kerak edi
            </p>
          )}

          <p className="text-muted-foreground">
            {finishResult.correct} / {finishResult.total} to'g'ri javob
          </p>
          {finishResult.total > 0 && (
            <p className="text-3xl font-bold text-primary">
              {Math.round((finishResult.correct / finishResult.total) * 100)}%
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
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

  // ─── Active test ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-sm text-muted-foreground">{getFlowLabel(attempt.flowType)}</span>
          <div className="text-lg font-semibold">
            {t.question} {currentIndex + 1} {t.of} {questions.length}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Exam mistake counter */}
          {isExam && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border",
                wrongCount >= 2
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : wrongCount === 1
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {wrongCount} / 3 xato
            </div>
          )}

          {/* Countdown timer */}
          {timeLeft !== null && (
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-semibold",
                timeLeft < 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-foreground"
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}

          {/* Finish button — always visible */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinish}
            disabled={finishMutation.isPending || finished}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <Flag className="h-4 w-4 mr-1.5" />
            {finishMutation.isPending ? t.loading : "Yakunlash"}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {answeredCount}/{questions.length} javoblandi
        </p>
      </div>

      {/* Question navigation dots — hidden for Marathon (too many questions) */}
      {!isMarathon && (
        <div className="flex flex-wrap gap-1">
          {questions.map((q, i) => {
            const state = answerStates[q.questionId];
            return (
              <button
                key={q.questionId}
                onClick={() => goTo(i)}
                className={cn(
                  "w-7 h-7 rounded text-xs font-medium transition-colors",
                  i === currentIndex && "ring-2 ring-primary ring-offset-1 ring-offset-background",
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
      )}

      {/* Question card */}
      <Card>
        <CardHeader>
          {currentQ.imageUrl && (
            <img
              src={currentQ.imageUrl}
              alt="Savol rasmi"
              className="w-full max-h-64 object-contain rounded-lg bg-muted mb-3"
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
                  !revealed && "border-border hover:border-primary/50 hover:bg-primary/5",
                  revealed && isCorrectAnswer && "border-emerald-500/50 bg-emerald-950/30 text-emerald-300",
                  revealed && chosen && !isCorrectAnswer && "border-red-500/50 bg-red-950/30 text-red-300",
                  revealed && !chosen && !isCorrectAnswer && "border-border opacity-50",
                  (revealed || finished || answerMutation.isPending) && "cursor-default"
                )}
                onClick={() => handleAnswer(currentQ.questionId, answer.id)}
                disabled={!!currentAnswerState || finished || answerMutation.isPending}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      !revealed && "border-muted-foreground/30",
                      revealed && isCorrectAnswer && "border-emerald-600 bg-emerald-600 text-white",
                      revealed && chosen && !isCorrectAnswer && "border-red-600 bg-red-600 text-white",
                      revealed && !chosen && !isCorrectAnswer && "border-muted-foreground/20"
                    )}
                  >
                    {`F${currentQ.answers.indexOf(answer) + 1}`}
                  </span>
                  <span>{answer.text}</span>
                  {revealed && isCorrectAnswer && (
                    <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto flex-shrink-0" />
                  )}
                  {revealed && chosen && !isCorrectAnswer && (
                    <XCircle className="h-4 w-4 text-red-400 ml-auto flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation: Prev / Next only */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => goTo(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.prev}
        </Button>

        <Button
          variant="outline"
          onClick={() => goTo(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          {t.next}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
