import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApplicationsApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { TeacherApplicationDto } from "@/types";

function ApplicationCard({
  app,
  onApprove,
  onReject,
}: {
  app: TeacherApplicationDto;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">{app.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(app.createdAt), "dd.MM.yyyy HH:mm")}
          </p>
          {app.rejectionReason && (
            <p className="text-sm text-destructive mt-2">Sabab: {app.rejectionReason}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {app.status === "Pending" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onApprove?.(app.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t.approve}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject?.(app.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {t.reject}
              </Button>
            </>
          )}
          {app.status === "Approved" && <Badge variant="success">Tasdiqlandi</Badge>}
          {app.status === "Rejected" && <Badge variant="destructive">Rad etildi</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicationsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["applications", "Pending"],
    queryFn: () => adminApplicationsApi.list("Pending"),
  });

  const { data: all, isLoading: loadingAll } = useQuery({
    queryKey: ["applications", "all"],
    queryFn: () => adminApplicationsApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: adminApplicationsApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Ariza tasdiqlandi" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, r }: { id: string; r: string }) => adminApplicationsApi.reject(id, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setRejectId(null);
      setReason("");
      toast({ title: "Ariza rad etildi" });
    },
  });

  if (loadingPending) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.applications}</h1>
        <p className="text-muted-foreground mt-1">O'qituvchi arizalari</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Ko'rib chiqilmoqda ({pending?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending?.map((app: TeacherApplicationDto) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => setRejectId(id)}
            />
          ))}
          {pending?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                Ko'rib chiqilishi kerak bo'lgan arizalar yo'q
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {loadingAll ? <PageLoader /> : all?.map((app: TeacherApplicationDto) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={app.status === "Pending" ? (id) => approveMutation.mutate(id) : undefined}
              onReject={app.status === "Pending" ? (id) => setRejectId(id) : undefined}
            />
          ))}
          {!loadingAll && all?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                Arizalar yo'q
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{t.rejectionReason}</Label>
            <Input
              placeholder="Rad etish sababini kiriting"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>{t.cancel}</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: rejectId!, r: reason })}
              disabled={!reason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t.loading : t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
