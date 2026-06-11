import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testLinksApi, type CreateTestLinkRequest } from "@/api/testLinks";
import { biletsApi } from "@/api/bilets";
import { topicsApi } from "@/api/topics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t, getFlowLabel } from "@/lib/i18n";
import { Plus, Copy, XCircle, BarChart2, Send } from "lucide-react";
import { useState } from "react";
import { format, addDays } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import type { TestLinkResultItemDto } from "@/types";

const FLOW_OPTIONS = [
  { value: "1", label: "Bilet" },
  { value: "2", label: "Mavzu" },
  { value: "3", label: "Ixtiyoriy" },
  { value: "4", label: "Imtihon" },
  { value: "5", label: "Marafon" },
];

export function TestLinksPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    flowType: "4",
    biletId: "",
    topicId: "",
    maxAttempts: "1",
    expiresAt: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  });

  const { data: links, isLoading } = useQuery({
    queryKey: ["test-links"],
    queryFn: testLinksApi.list,
  });

  const { data: bilets } = useQuery({
    queryKey: ["bilets"],
    queryFn: biletsApi.list,
  });

  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: topicsApi.list,
  });

  const { data: results } = useQuery({
    queryKey: ["test-link-results", resultsId],
    queryFn: () => testLinksApi.results(resultsId!),
    enabled: !!resultsId,
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateTestLinkRequest) => testLinksApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-links"] });
      setCreateOpen(false);
      toast({ title: "Test havolasi yaratildi" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: testLinksApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-links"] });
      toast({ title: "Havola o'chirildi" });
    },
  });

  const handleCreate = () => {
    const req: CreateTestLinkRequest = {
      title: form.title,
      flowType: parseInt(form.flowType),
      maxAttempts: parseInt(form.maxAttempts),
      expiresAt: new Date(form.expiresAt).toISOString(),
    };
    if (form.flowType === "1" && form.biletId) req.biletId = form.biletId;
    if (form.flowType === "2" && form.topicId) req.topicIds = [form.topicId];
    createMutation.mutate(req);
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/t/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: t.copied });
  };

  const copyTelegramLink = (code: string) => {
    const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "pravadrive_bot";
    const appName = import.meta.env.VITE_TELEGRAM_APP_NAME ?? "PravaDrive";
    const url = `https://t.me/${bot}/${appName}?startapp=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Telegram havolasi nusxalandi" });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.testLinks}</h1>
          <p className="text-muted-foreground mt-1">Test havolalarini boshqaring</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.createTestLink}
        </Button>
      </div>

      {/* Links table */}
      <Card>
        <CardContent className="p-0">
          {links && links.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sarlavha</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Havola kodi</TableHead>
                  <TableHead>Urinishlar</TableHead>
                  <TableHead>Muddati</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.title}</TableCell>
                    <TableCell>{getFlowLabel(link.flowType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{link.code}</code>
                        <button onClick={() => copyLink(link.code)} className="text-muted-foreground hover:text-foreground" title="Veb havolani nusxalash">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button onClick={() => copyTelegramLink(link.code)} className="text-muted-foreground hover:text-blue-400" title="Telegram havolasini nusxalash">
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.attemptsCount}/{link.maxAttempts === 0 ? "∞" : link.maxAttempts}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(link.expiresAt), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.isActive ? "success" : "secondary"}>
                        {link.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResultsId(link.id)}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                        {link.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deactivateMutation.mutate(link.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Hali test havolalari yo'q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.createTestLink}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.title}</Label>
              <Input
                placeholder="Test sarlavhasi"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Test turi</Label>
              <Select value={form.flowType} onValueChange={(v) => setForm((f) => ({ ...f, flowType: v, biletId: "", topicId: "" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLOW_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.flowType === "1" && (
              <div className="space-y-2">
                <Label>Bilet</Label>
                <Select value={form.biletId} onValueChange={(v) => setForm((f) => ({ ...f, biletId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bilet tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {bilets?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>Bilet #{b.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.flowType === "2" && (
              <div className="space-y-2">
                <Label>Mavzu</Label>
                <Select value={form.topicId} onValueChange={(v) => setForm((f) => ({ ...f, topicId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mavzu tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.maxAttempts}</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxAttempts}
                  onChange={(e) => setForm((f) => ({ ...f, maxAttempts: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.expiresAtLabel}</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t.cancel}</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? t.loading : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results dialog */}
      <Dialog open={!!resultsId} onOpenChange={(o) => !o && setResultsId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Natijalar</DialogTitle>
          </DialogHeader>
          {results && results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Natija</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r: TestLinkResultItemDto) => (
                    <TableRow key={r.attemptId}>
                      <TableCell className="text-sm">{r.email}</TableCell>
                      <TableCell className="text-sm">
                        {r.correctCount !== null && r.correctCount !== undefined
                          ? `${r.correctCount}/${r.totalQuestions}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "Passed" ? "success" : r.status === "Failed" ? "destructive" : "secondary"}>
                          {r.status === "Passed" ? "O'tdi" : r.status === "Failed" ? "O'tmadi" : r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Hali natijalar yo'q</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
