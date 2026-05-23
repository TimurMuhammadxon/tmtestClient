import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApplicationsApi, type ApplicationListItemDto } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function ApplicationsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["applications", "Pending", pendingPage],
    queryFn: () => adminApplicationsApi.list({ status: "Pending", page: pendingPage, pageSize: 20 }),
  });

  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ["applications", "all", allPage],
    queryFn: () => adminApplicationsApi.list({ page: allPage, pageSize: 20 }),
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

  const pendingTotal = pendingData?.totalCount ?? 0;
  const pendingPages = Math.ceil(pendingTotal / 20);
  const allPages = Math.ceil((allData?.totalCount ?? 0) / 20);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">O'qituvchi arizalari</h1>
        <p className="text-muted-foreground mt-1">Yangi va ko'rib chiqilgan arizalar</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Ko'rib chiqilmoqda ({pendingTotal})
          </TabsTrigger>
          <TabsTrigger value="all">Barchasi ({allData?.totalCount ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <ApplicationTable
            items={pendingData?.items ?? []}
            onApprove={(id) => approveMutation.mutate(id)}
            onReject={(id) => setRejectId(id)}
            showActions
          />
          <Pager page={pendingPage} total={pendingPages} onChange={setPendingPage} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {loadingAll ? (
            <PageLoader />
          ) : (
            <ApplicationTable
              items={allData?.items ?? []}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => setRejectId(id)}
              showActions
            />
          )}
          <Pager page={allPage} total={allPages} onChange={setAllPage} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rad etish sababi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Sabab</Label>
            <Input
              placeholder="Rad etish sababini kiriting"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Bekor qilish</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: rejectId!, r: reason })}
              disabled={!reason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Saqlanmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationTable({
  items,
  onApprove,
  onReject,
  showActions,
}: {
  items: ApplicationListItemDto[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          Arizalar yo'q
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Tashkilot</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
              {showActions && <TableHead className="text-right">Amallar</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.userEmail}</TableCell>
                <TableCell>{app.fullName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{app.phoneNumber}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {app.organizationName ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={app.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(app.submittedAt), "dd.MM.yyyy")}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    {app.status === "Pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                          onClick={() => onApprove?.(app.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Tasdiqlash
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => onReject?.(app.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rad etish
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Approved") return <Badge variant="success">Tasdiqlandi</Badge>;
  if (status === "Rejected") return <Badge variant="destructive">Rad etildi</Badge>;
  return <Badge variant="secondary">Kutilmoqda</Badge>;
}

function Pager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">{page} / {total}</span>
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page >= total}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
