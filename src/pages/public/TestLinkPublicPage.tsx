import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { testLinksApi } from "@/api/testLinks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/store/auth";
import { getFlowLabel } from "@/lib/i18n";
import { format } from "date-fns";
import { BookOpen, Clock, Target, AlertTriangle } from "lucide-react";

export function TestLinkPublicPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data: link, isLoading, error } = useQuery({
    queryKey: ["test-link-public", code],
    queryFn: () => testLinksApi.getPublic(code!),
    enabled: !!code,
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => testLinksApi.start(code!),
    onSuccess: ({ id }) => navigate(`/attempts/${id}`),
  });

  const handleStart = () => {
    if (!isAuthenticated()) {
      navigate(`/login?redirect=/t/${code}`);
      return;
    }
    startMutation.mutate();
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <PageLoader />
    </div>
  );

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
        <Card className="max-w-md w-full" style={{ background: "rgba(13,13,22,0.9)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <CardContent className="flex flex-col items-center py-12 gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Havola topilmadi</h2>
            <p className="text-muted-foreground">
              Havola noto'g'ri yoki muddati tugagan bo'lishi mumkin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(link.expiresAt) < new Date();
  const attemptsLeft = link.maxAttempts - link.attemptsUsed;
  const canStart = link.isActive && !isExpired && attemptsLeft > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
      <Card className="max-w-md w-full" style={{ background: "rgba(13,13,22,0.9)", border: "1px solid rgba(0,240,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{link.title}</CardTitle>
          <CardDescription>{getFlowLabel(link.flowType)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                Urinishlar
              </div>
              <p className="font-semibold">
                {link.attemptsUsed} / {link.maxAttempts}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Muddati
              </div>
              <p className="font-semibold text-sm">
                {format(new Date(link.expiresAt), "dd.MM.yyyy")}
              </p>
            </div>
          </div>

          {!link.isActive && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              Bu havola o'chirilgan
            </div>
          )}
          {isExpired && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              Havola muddati tugagan
            </div>
          )}
          {attemptsLeft <= 0 && link.isActive && !isExpired && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertTriangle className="h-4 w-4" />
              Urinishlar soni tugagan
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={!canStart || startMutation.isPending}
          >
            {startMutation.isPending ? "Yuklanmoqda..." : "Testni boshlash"}
          </Button>

          {!isAuthenticated() && (
            <p className="text-center text-sm text-muted-foreground">
              Test topshirish uchun avval kirish talab etiladi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
