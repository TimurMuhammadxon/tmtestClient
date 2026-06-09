import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminBiletsApi,
  adminQuestionsApi,
  adminTopicsApi,
  type BiletListItemDto,
  type BiletDetailsDto,
  type QuestionAdminListItemDto,
} from "@/api/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  StarOff,
} from "lucide-react";
import { useState, useEffect } from "react";

type DialogMode = "create" | "edit" | "view" | null;

interface BiletForm {
  number: string;
  isDemo: boolean;
  selectedIds: string[];
}

const emptyForm = (): BiletForm => ({ number: "", isDemo: false, selectedIds: [] });

export function BiletsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<DialogMode>(null);
  const [editing, setEditing] = useState<BiletListItemDto | null>(null);
  const [viewing, setViewing] = useState<BiletDetailsDto | null>(null);
  const [form, setForm] = useState<BiletForm>(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bilets", page],
    queryFn: () => adminBiletsApi.list({ page, pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (f: BiletForm) =>
      adminBiletsApi.create({
        number: parseInt(f.number),
        isDemo: f.isDemo,
        questionIds: f.selectedIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bilets"] });
      setMode(null);
      toast({ title: "Bilet yaratildi" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: e?.response?.data?.detail ?? e?.response?.data?.title ?? "Xatolik yuz berdi" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ids }: { id: string; ids: string[] }) =>
      adminBiletsApi.update(id, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bilets"] });
      setMode(null);
      toast({ title: "Bilet yangilandi" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: e?.response?.data?.detail ?? e?.response?.data?.title ?? "Xatolik yuz berdi" }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminBiletsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bilets"] });
      toast({ title: "Bilet o'chirildi" });
    },
    onError: () => toast({ variant: "destructive", title: "O'chirib bo'lmadi" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? adminBiletsApi.activate(id) : adminBiletsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bilets"] }),
  });

  const toggleDemoMutation = useMutation({
    mutationFn: ({ id, demo }: { id: string; demo: boolean }) =>
      demo ? adminBiletsApi.markDemo(id) : adminBiletsApi.unmarkDemo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bilets"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), number: String((data?.totalCount ?? 0) + 1) });
    setMode("create");
  };

  const openEdit = async (bilet: BiletListItemDto) => {
    setEditing(bilet);
    const full = await adminBiletsApi.getById(bilet.id);
    setForm({
      number: String(bilet.number),
      isDemo: bilet.isDemo,
      selectedIds: full.questions.map((q) => q.questionId),
    });
    setMode("edit");
  };

  const openView = async (bilet: BiletListItemDto) => {
    const full = await adminBiletsApi.getById(bilet.id);
    setViewing(full);
    setMode("view");
  };

  const handleSave = () => {
    if (mode === "edit" && editing) {
      updateMutation.mutate({ id: editing.id, ids: form.selectedIds });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const totalPages = data ? Math.ceil(data.totalCount / 20) : 1;

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biletlar</h1>
          <p className="text-muted-foreground mt-1">Jami: {data?.totalCount ?? 0} ta bilet</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Bilet qo'shish
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">№</TableHead>
                <TableHead>Savollar</TableHead>
                <TableHead>Demo</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((bilet) => (
                <TableRow key={bilet.id}>
                  <TableCell className="font-mono font-bold text-lg">
                    {bilet.number}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{bilet.questionsCount} ta savol</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={bilet.isDemo ? "text-amber-500" : "text-muted-foreground"}
                      onClick={() =>
                        toggleDemoMutation.mutate({ id: bilet.id, demo: !bilet.isDemo })
                      }
                      title={bilet.isDemo ? "Demo belgisini olib tashlash" : "Demo qilish"}
                    >
                      {bilet.isDemo ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={bilet.isActive}
                        onCheckedChange={(v) =>
                          toggleActiveMutation.mutate({ id: bilet.id, active: v })
                        }
                      />
                      <Badge variant={bilet.isActive ? "success" : "secondary"} className="text-xs">
                        {bilet.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ko'rish"
                        onClick={() => openView(bilet)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Tahrirlash"
                        onClick={() => openEdit(bilet)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        title="O'chirish"
                        onClick={() => {
                          if (confirm(`${bilet.number}-biletni o'chirishni tasdiqlaysizmi?`))
                            deleteMutation.mutate(bilet.id);
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
                    Biletlar yo'q. Birinchi biletni yarating.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={mode === "create" || mode === "edit"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? `${editing?.number}-biletni tahrirlash` : "Yangi bilet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {mode === "create" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bilet raqami</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <Checkbox
                    id="bilet-demo"
                    checked={form.isDemo}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isDemo: !!v }))}
                  />
                  <Label htmlFor="bilet-demo">Demo bilet</Label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Savollar ({form.selectedIds.length} tanlangan)</Label>
                {form.selectedIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setForm((f) => ({ ...f, selectedIds: [] }))}
                  >
                    Barchasini olib tashlash
                  </Button>
                )}
              </div>
              <QuestionPicker
                selectedIds={form.selectedIds}
                onChange={(ids) => setForm((f) => ({ ...f, selectedIds: ids }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>Bekor qilish</Button>
            <Button
              onClick={handleSave}
              disabled={
                isPending ||
                (mode === "create" && !form.number.trim()) ||
                form.selectedIds.length === 0
              }
            >
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={mode === "view"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewing?.number}-bilet — {viewing?.questions.length ?? 0} ta savol
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {viewing?.questions.map((q, i) => (
              <div key={q.questionId} className="border rounded-md p-3 text-sm">
                <p className="font-medium text-muted-foreground mb-1">{i + 1}.</p>
                <p>{q.text}</p>
                <ul className="mt-2 space-y-1">
                  {q.answers.map((a) => (
                    <li
                      key={a.id}
                      className={a.isCorrect ? "text-green-600 font-medium" : "text-muted-foreground"}
                    >
                      {a.isCorrect ? "✓" : "○"} {a.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Question Picker ---
function QuestionPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [topicId, setTopicId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [qPage, setQPage] = useState(1);

  useEffect(() => { setQPage(1); }, [topicId, search]);

  const { data: topics } = useQuery({
    queryKey: ["admin-topics-picker"],
    queryFn: () => adminTopicsApi.list({ pageSize: 100 }),
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin-questions-picker", topicId, search, qPage],
    queryFn: () =>
      adminQuestionsApi.list({
        topicId: topicId === "all" ? undefined : topicId,
        search: search || undefined,
        page: qPage,
        pageSize: 15,
      }),
  });

  const toggle = (q: QuestionAdminListItemDto) => {
    if (selectedIds.includes(q.id)) {
      onChange(selectedIds.filter((id) => id !== q.id));
    } else {
      onChange([...selectedIds, q.id]);
    }
  };

  const totalPages = questions ? Math.ceil(questions.totalCount / 15) : 1;

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex gap-2">
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Mavzu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha mavzular</SelectItem>
            {topics?.items.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Savol qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {questions?.items.map((q) => {
            const selected = selectedIds.includes(q.id);
            return (
              <label
                key={q.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                  }`}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggle(q)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex gap-3 flex-1 min-w-0">
                  {/* Image */}
                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="w-20 h-14 object-cover rounded border flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{q.defaultText}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {q.answers.map((a, i) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${a.isCorrect
                              ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/30"
                              : "text-muted-foreground"
                            }`}
                        >
                          <span className="font-semibold flex-shrink-0">{`F${i + 1}.`}</span>
                          <span className="line-clamp-1">{a.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
          {questions?.items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Savollar topilmadi</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQPage((p) => p - 1)}
            disabled={qPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{qPage} / {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQPage((p) => p + 1)}
            disabled={qPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
