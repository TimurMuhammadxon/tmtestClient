import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { attemptsApi } from "@/api/attempts";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useTranslation, getFlowLabel } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import {
  CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Flag, AlertTriangle,
  BookOpen, Volume2,
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
  const t = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<FinishResultState | null>(null);
  const [showQoida, setShowQoida] = useState(false);
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
    setShowQoida(false);
  };

  const goPrev = () => goTo(Math.max(0, currentIndex - 1));
  const goNext = () => goTo(Math.min((attempt?.questions.length ?? 1) - 1, currentIndex + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff < 0) goNext();
    else goPrev();
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
            border: `2px solid ${passed
                ? "rgba(16,185,129,0.3)"
                : completed
                  ? "rgba(59,130,246,0.3)"
                  : "rgba(239,68,68,0.3)"
              }`,
            boxShadow: `0 0 30px ${passed
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
              ? `${t.congratsPassed} 🎉`
              : completed
                ? t.testCompleted
                : examFail3Mistakes
                  ? `${t.examFailTitle} 😔`
                  : `${t.failedResult} 😔`}
          </h2>

          {examFail3Mistakes && (
            <p className="text-sm font-medium text-red-400">
              {t.exam3Mistakes}
            </p>
          )}
          {failed && !examFail3Mistakes && (
            <p className="text-sm text-muted-foreground">
              {t.examPassMin}
            </p>
          )}

          <p className="text-muted-foreground">
            {finishResult.correct} / {finishResult.total} {t.correctAnswerCount}
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
    <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header row — single line: counter left, actions right */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-xs text-muted-foreground leading-tight">{getFlowLabel(attempt.flowType)}</span>
          <div className="text-base font-semibold leading-tight whitespace-nowrap">
            {t.question} {currentIndex + 1} {t.of} {questions.length}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Exam mistake counter */}
          {isExam && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border",
                wrongCount >= 2
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : wrongCount === 1
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-muted text-muted-foreground border-border"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {wrongCount}/3
            </div>
          )}

          {/* Countdown timer */}
          {timeLeft !== null && (
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-semibold text-sm",
                timeLeft < 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}

          {/* Finish — icon-only in exam (chips take the row), text elsewhere */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinish}
            disabled={finishMutation.isPending || finished}
            className={cn(
              "text-muted-foreground hover:text-destructive hover:border-destructive/50",
              isExam ? "w-9 px-0" : "px-2.5"
            )}
            title={isExam ? t.finish : undefined}
            aria-label={t.finish}
          >
            <Flag className="h-4 w-4" />
            {!isExam && <span className="ml-1.5">{finishMutation.isPending ? t.loading : t.finish}</span>}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {answeredCount}/{questions.length} {t.answered}
        </p>
      </div>

      {/* Question navigator — single scrollable row above the content */}
      {!isMarathon && (
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto py-1.5 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {questions.map((q, i) => {
              const state = answerStates[q.questionId];
              return (
                <button
                  key={q.questionId}
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-md text-[11px] font-semibold transition-colors",
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
          {/* fade hint that the row scrolls */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}

      {/* Question: two-column when image exists, single column otherwise */}
      <div className={cn(
        currentQ.imageUrl
          ? "lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:items-start space-y-4 lg:space-y-0"
          : "space-y-4"
      )}>
        {/* Question — top-left on wide screens */}
        <p
          className="font-medium leading-relaxed lg:col-start-1 lg:row-start-1"
          style={{ fontSize: "clamp(1.05rem, 0.95rem + 0.7vw, 1.6rem)" }}
        >
          {currentQ.text}
        </p>

        {/* Image — right column on wide screens (spans both rows); after question on phone */}
        {currentQ.imageUrl && (
          <div className="flex items-start justify-center lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <img
              src={currentQ.imageUrl}
              alt=""
              className="w-full rounded-lg max-h-[38vh] lg:max-h-[28rem] object-contain bg-muted"
            />
          </div>
        )}

        {/* Answers — left column, below the question on wide screens */}
        <div className="space-y-3 lg:col-start-1 lg:row-start-2">
            <div className="space-y-2">
              {currentQ.answers.map((answer) => {
              const chosen = currentAnswerState?.chosenId === answer.id;
              const isCorrectAnswer = currentAnswerState?.correctId === answer.id;
              const revealed = !!currentAnswerState;

              return (
                <button
                  key={answer.id}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg border-2 transition-all text-sm",
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
                    <span style={{ fontSize: "clamp(0.9rem, 0.85rem + 0.4vw, 1.2rem)" }}>{answer.text}</span>
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
          </div>

          {showQoida && currentQ.explanation && !!currentAnswerState && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/15 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">{t.qoida}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {showQoida && !currentAnswerState && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground text-center">
                {t.answerFirst}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed bottom nav */}
      <div className="h-20" />

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-3">
        <div className="max-w-4xl lg:max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-14 flex-shrink-0"
            aria-label={t.prev}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {attempt?.showExplanations && (
            <div className="flex items-center gap-2 justify-center flex-1">
              <Button
                variant={showQoida ? "default" : "outline"}
                size="sm"
                onClick={() => setShowQoida((v) => !v)}
                className={cn("px-3", showQoida ? "" : "text-muted-foreground")}
              >
                <BookOpen className="h-4 w-4 mr-1.5" />
                {t.qoida}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-9 px-0 text-muted-foreground opacity-50"
                title={`${t.audioLearn} · ${t.comingSoon}`}
                aria-label={t.audioLearn}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="w-14 flex-shrink-0"
            aria-label={t.next}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
