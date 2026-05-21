import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminTopicsApi, type TopicAdminDto } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TopicForm {
  code: string;
  orderIndex: string;
  isDemo: boolean;
  nameUz: string;
  nameRu: string;
}

const emptyForm = (): TopicForm => ({
  code: "",
  orderIndex: "1",
  isDemo: false,
  nameUz: "",
  nameRu: "",
});

export function TopicsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingTopic, setEditingTopic] = useState<TopicAdminDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TopicForm>(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-topics", page],
    queryFn: () => adminTopicsApi.list({ page, pageSize: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (f: TopicForm) =>
      adminTopicsApi.create({
        code: f.code,
        orderIndex: parseInt(f.orderIndex),
        isDemo: f.isDemo,
        translations: [
          { languageCode: "uz-latn", name: f.nameUz },
          ...(f.nameRu ? [{ languageCode: "ru", name: f.nameRu }] : []),
        ],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
      setDialogOpen(false);
      toast({ title: "Mavzu qo'shildi" });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { title?: string } } })?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Xatolik yuz berdi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: TopicForm }) =>
      adminTopicsApi.update(id, {
        code: f.code,
        orderIndex: parseInt(f.orderIndex),
        isDemo: f.isDemo,
      }).then(async () => {
        await adminTopicsApi.upsertTranslation(id, "uz-latn", f.nameUz);
        if (f.nameRu) await adminTopicsApi.upsertTranslation(id, "ru", f.nameRu);
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
      setDialogOpen(false);
      toast({ title: "Mavzu yangilandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik yuz berdi" }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminTopicsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-topics"] });
      toast({ title: "Mavzu o'chirildi" });
    },
    onError: () => toast({ variant: "destructive", title: "O'chirib bo'lmadi (savollar bor)" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? adminTopicsApi.activate(id) : adminTopicsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topics"] }),
  });

  const openCreate = () => {
    setEditingTopic(null);
    setForm({ ...emptyForm(), orderIndex: String((data?.total ?? 0) + 1) });
    setDialogOpen(true);
  };

  const openEdit = async (topic: TopicAdminDto) => {
    setEditingTopic(topic);
    // load translations
    const full = await adminTopicsApi.getById(topic.id);
    const uz = full.translations?.find((t) => t.languageCode === "uz-latn")?.name ?? "";
    const ru = full.translations?.find((t) => t.languageCode === "ru")?.name ?? "";
    setForm({
      code: topic.code,
      orderIndex: String(topic.orderIndex),
      isDemo: topic.isDemo,
      nameUz: uz,
      nameRu: ru,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic.id, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mavzular</h1>
          <p className="text-muted-foreground mt-1">Jami: {data?.total ?? 0} ta mavzu</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Mavzu qo'shish
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Kodi</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Demo</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="text-muted-foreground font-mono">
                    {topic.orderIndex}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium font-mono text-sm">{topic.code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={topic.isActive}
                        onCheckedChange={(v) =>
                          toggleActiveMutation.mutate({ id: topic.id, active: v })
                        }
                      />
                      <Badge variant={topic.isActive ? "success" : "secondary"} className="text-xs">
                        {topic.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {topic.isDemo && <Badge variant="default" className="text-xs">Demo</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(topic)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`"${topic.code}" mavzusini o'chirishni tasdiqlaysizmi?`))
                            deleteMutation.mutate(topic.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Mavzular yo'q. Birinchi mavzuni yarating.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Mavzuni tahrirlash" : "Yangi mavzu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kod (slug)</Label>
                <Input
                  placeholder="masalan: road-signs"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Inglizcha, tire bilan</p>
              </div>
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.orderIndex}
                  onChange={(e) => setForm((f) => ({ ...f, orderIndex: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nomi (uz-latn) *</Label>
              <Input
                placeholder="Masalan: Yo'l belgilari"
                value={form.nameUz}
                onChange={(e) => setForm((f) => ({ ...f, nameUz: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi (ru) — ixtiyoriy</Label>
              <Input
                placeholder="Дорожные знаки"
                value={form.nameRu}
                onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="isDemo"
                checked={form.isDemo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isDemo: !!v }))}
              />
              <Label htmlFor="isDemo">Demo mavzu</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={handleSave}
              disabled={!form.code.trim() || !form.nameUz.trim() || isPending}
            >
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
