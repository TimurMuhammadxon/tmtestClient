import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  adminQuestionsApi,
  adminTopicsApi,
  type QuestionAdminListItemDto,
  type QuestionAdminDto,
  type AnswerInput,
} from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight,
  ImagePlus, X, Search, ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerDraft {
  orderIndex: number;
  textUz: string;
  textCyrl: string;
  textRu: string;
  isCorrect: boolean;
}

const defaultAnswers = (): AnswerDraft[] => [
  { orderIndex: 1, textUz: "", textCyrl: "", textRu: "", isCorrect: false },
  { orderIndex: 2, textUz: "", textCyrl: "", textRu: "", isCorrect: false },
];

function toAnswerInputs(drafts: AnswerDraft[]): AnswerInput[] {
  return drafts.map((d) => ({
    orderIndex: d.orderIndex,
    isCorrect: d.isCorrect,
    translations: [
      ...(d.textUz.trim() ? [{ languageCode: "uz-latn", text: d.textUz.trim() }] : []),
      ...(d.textCyrl.trim() ? [{ languageCode: "uz-cyrl", text: d.textCyrl.trim() }] : []),
      ...(d.textRu.trim() ? [{ languageCode: "ru", text: d.textRu.trim() }] : []),
    ],
  }));
}

export function QuestionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageDialogId, setImageDialogId] = useState<string | null>(null);

  // Form state
  const [selectedTopic, setSelectedTopic] = useState("");
  const [textUz, setTextUz] = useState("");
  const [textCyrl, setTextCyrl] = useState("");
  const [textRu, setTextRu] = useState("");
  const [explanationUz, setExplanationUz] = useState("");
  const [explanationCyrl, setExplanationCyrl] = useState("");
  const [explanationRu, setExplanationRu] = useState("");
  const [answers, setAnswers] = useState<AnswerDraft[]>(defaultAnswers());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: topicsData } = useQuery({
    queryKey: ["admin-topics-all"],
    queryFn: () => adminTopicsApi.list({ page: 1, pageSize: 200 }),
  });
  const topics = topicsData?.items ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-questions", page, topicFilter, search],
    queryFn: () =>
      adminQuestionsApi.list({
        page,
        pageSize: 20,
        topicId: topicFilter !== "all" ? topicFilter : undefined,
        search: search || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminQuestionsApi.create({
        topicId: selectedTopic,
        translations: [
          { languageCode: "uz-latn", text: textUz, explanation: explanationUz || undefined },
          ...(textCyrl ? [{ languageCode: "uz-cyrl", text: textCyrl, explanation: explanationCyrl || undefined }] : []),
          ...(textRu ? [{ languageCode: "ru", text: textRu, explanation: explanationRu || undefined }] : []),
        ],
        answers: toAnswerInputs(answers),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      setDialogOpen(false);
      toast({ title: "Savol qo'shildi" });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { title?: string } } })?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Xatolik yuz berdi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminQuestionsApi.upsertTranslation(id, "uz-latn", textUz, explanationUz || undefined);
      if (textCyrl) await adminQuestionsApi.upsertTranslation(id, "uz-cyrl", textCyrl, explanationCyrl || undefined);
      if (textRu) await adminQuestionsApi.upsertTranslation(id, "ru", textRu, explanationRu || undefined);
      await adminQuestionsApi.update(id, {
        topicId: selectedTopic,
        answers: toAnswerInputs(answers),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      setDialogOpen(false);
      toast({ title: "Savol yangilandi" });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { title?: string; errors?: Record<string, string[]> } } };
      const errors = err?.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      const msg = firstError ?? err?.response?.data?.title ?? "Xatolik yuz berdi";
      toast({ variant: "destructive", title: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminQuestionsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Savol o'chirildi" });
    },
    onError: () => toast({ variant: "destructive", title: "O'chirib bo'lmadi (biletda ishlatilgan bo'lishi mumkin)" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? adminQuestionsApi.activate(id) : adminQuestionsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-questions"] }),
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminQuestionsApi.uploadImage(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      setImageDialogId(null);
      toast({ title: "Rasm yuklandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Rasm yuklanmadi" }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: adminQuestionsApi.deleteImage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Rasm o'chirildi" });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setSelectedTopic(topics[0]?.id ?? "");
    setTextUz("");
    setTextCyrl("");
    setTextRu("");
    setExplanationUz("");
    setExplanationCyrl("");
    setExplanationRu("");
    setAnswers(defaultAnswers());
    setDialogOpen(true);
  };

  const openEdit = async (q: QuestionAdminListItemDto) => {
    setEditingId(q.id);
    const full: QuestionAdminDto = await adminQuestionsApi.getById(q.id);
    const uz = full.translations.find((t) => t.languageCode === "uz-latn");
    const cyrl = full.translations.find((t) => t.languageCode === "uz-cyrl");
    const ru = full.translations.find((t) => t.languageCode === "ru");
    setSelectedTopic(full.topicId);
    setTextUz(uz?.text ?? "");
    setTextCyrl(cyrl?.text ?? "");
    setTextRu(ru?.text ?? "");
    setExplanationUz(uz?.explanation ?? "");
    setExplanationCyrl(cyrl?.explanation ?? "");
    setExplanationRu(ru?.explanation ?? "");
    setAnswers(
      full.answers.map((a) => ({
        orderIndex: a.orderIndex,
        isCorrect: a.isCorrect,
        textUz: a.translations.find((t) => t.languageCode === "uz-latn")?.text ?? "",
        textCyrl: a.translations.find((t) => t.languageCode === "uz-cyrl")?.text ?? "",
        textRu: a.translations.find((t) => t.languageCode === "ru")?.text ?? "",
      }))
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTopic) return;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) {
      toast({ variant: "destructive", title: "Aynan 1 ta to'g'ri javob bo'lishi kerak" });
      return;
    }
    const emptyAnswer = answers.find((a) => !a.textUz.trim());
    if (emptyAnswer) {
      toast({ variant: "destructive", title: "Barcha javoblarning uz-latn matni to'ldirilishi kerak" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  const setAnswer = (i: number, field: keyof AnswerDraft, value: string | boolean) => {
    setAnswers((prev) => {
      const next = [...prev];
      if (field === "isCorrect" && value === true) {
        next.forEach((a, idx) => (next[idx] = { ...a, isCorrect: idx === i }));
      } else {
        next[i] = { ...next[i], [field]: value };
      }
      return next;
    });
  };

  const addAnswer = () => {
    if (answers.length >= 6) return;
    setAnswers((prev) => [
      ...prev,
      { orderIndex: prev.length + 1, textUz: "", textCyrl: "", textRu: "", isCorrect: false },
    ]);
  };

  const removeAnswer = (i: number) => {
    if (answers.length <= 2) return;
    setAnswers((prev) => {
      const next = prev.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, orderIndex: idx + 1 }));
      // if removed answer was correct, clear correct flag
      return next;
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const totalPages = data ? Math.ceil(data.totalCount / 20) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Savollar</h1>
          <p className="text-muted-foreground mt-1">Jami: {data?.totalCount ?? "..."} ta savol</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Savol qo'shish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={topicFilter} onValueChange={(v) => { setTopicFilter(v); setPage(1); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Mavzu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha mavzular</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-1 min-w-48">
          <Input
            placeholder="Savol matni bo'yicha qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
          />
          <Button variant="outline" onClick={() => { setSearch(searchInput); setPage(1); }}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question Cards */}
      {isLoading ? (
        <div className="py-12 flex justify-center"><LoadingSpinner /></div>
      ) : data?.items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Savollar topilmadi</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((q) => (
            <Card key={q.id} className={cn(!q.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {q.imageUrl ? (
                      <img
                        src={q.imageUrl}
                        alt=""
                        className="w-28 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImageDialogId(q.id)}
                      />
                    ) : (
                      <button
                        onClick={() => setImageDialogId(q.id)}
                        className="w-28 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors gap-1"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-xs">Rasm</span>
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{q.defaultText || "—"}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Switch
                          checked={q.isActive}
                          onCheckedChange={(v) => toggleActiveMutation.mutate({ id: q.id, active: v })}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => { if (confirm("Bu savolni o'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(q.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Answers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {q.answers.map((a, i) => (
                        <div
                          key={a.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
                            a.isCorrect
                              ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/30"
                              : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          <span className="font-semibold flex-shrink-0">
                            {`F${i + 1}.`}
                          </span>
                          <span className="line-clamp-1">{a.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2">
                      <Badge variant={q.isActive ? "success" : "secondary"} className="text-xs">
                        {q.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {topics.find((t) => t.id === q.topicId)?.code ?? q.topicId.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="uz">
            <TabsList className="mb-4">
              <TabsTrigger value="uz">O'zbek (uz-latn)</TabsTrigger>
              <TabsTrigger value="cyrl">Ўзбек (uz-cyrl)</TabsTrigger>
              <TabsTrigger value="ru">Русский (ru)</TabsTrigger>
              <TabsTrigger value="answers">Javoblar</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="uz" className="space-y-4">
              <div className="space-y-2">
                <Label>Savol matni (uz-latn) *</Label>
                <Textarea
                  rows={3}
                  placeholder="Savol matnini kiriting..."
                  value={textUz}
                  onChange={(e) => setTextUz(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tushuntirish (ixtiyoriy)</Label>
                <Textarea
                  rows={2}
                  placeholder="To'g'ri javob uchun tushuntirish..."
                  value={explanationUz}
                  onChange={(e) => setExplanationUz(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="cyrl" className="space-y-4">
              <div className="space-y-2">
                <Label>Савол матни (uz-cyrl) — ихтиёрий</Label>
                <Textarea
                  rows={3}
                  placeholder="Савол матнини киритинг..."
                  value={textCyrl}
                  onChange={(e) => setTextCyrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Тушунтириш (ихтиёрий)</Label>
                <Textarea
                  rows={2}
                  placeholder="Тўғри жавоб учун тушунтириш..."
                  value={explanationCyrl}
                  onChange={(e) => setExplanationCyrl(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="ru" className="space-y-4">
              <div className="space-y-2">
                <Label>Текст вопроса (ru) — необязательно</Label>
                <Textarea
                  rows={3}
                  placeholder="Введите текст вопроса..."
                  value={textRu}
                  onChange={(e) => setTextRu(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Объяснение (необязательно)</Label>
                <Textarea
                  rows={2}
                  placeholder="Объяснение правильного ответа..."
                  value={explanationRu}
                  onChange={(e) => setExplanationRu(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="answers" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Aynan 1 ta to'g'ri javob belgilang ({answers.length}/6)
                </p>
                {answers.length < 6 && (
                  <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Javob qo'shish
                  </Button>
                )}
              </div>
              {answers.map((answer, i) => (
                <div
                  key={i}
                  className={cn(
                    "border rounded-lg p-4 space-y-3",
                    answer.isCorrect && "border-emerald-600/50 bg-emerald-950/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {`F${i + 1}`} javob
                      {i < 2 && <span className="text-xs text-muted-foreground ml-1">(majburiy)</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={answer.isCorrect}
                          onCheckedChange={(v) => setAnswer(i, "isCorrect", !!v)}
                        />
                        <Label className="text-sm cursor-pointer">To'g'ri javob</Label>
                      </div>
                      {answers.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAnswer(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input
                    placeholder="Javob matni (uz-latn) *"
                    value={answer.textUz}
                    onChange={(e) => setAnswer(i, "textUz", e.target.value)}
                  />
                  <Input
                    placeholder="Жавоб матни (uz-cyrl) — ихтиёрий"
                    value={answer.textCyrl}
                    onChange={(e) => setAnswer(i, "textCyrl", e.target.value)}
                  />
                  <Input
                    placeholder="Javob matni (ru) — ixtiyoriy"
                    value={answer.textRu}
                    onChange={(e) => setAnswer(i, "textRu", e.target.value)}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="meta" className="space-y-4">
              <div className="space-y-2">
                <Label>Mavzu *</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mavzuni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={handleSave}
              disabled={!textUz.trim() || !selectedTopic || isPending}
            >
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image upload dialog */}
      <Dialog open={!!imageDialogId} onOpenChange={(o) => !o && setImageDialogId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Savol rasmi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {data?.items.find((q) => q.id === imageDialogId)?.imageUrl ? (
              <div className="space-y-3">
                <img
                  src={data?.items.find((q) => q.id === imageDialogId)?.imageUrl}
                  alt="Savol rasmi"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (imageDialogId) deleteImageMutation.mutate(imageDialogId);
                  }}
                  disabled={deleteImageMutation.isPending}
                >
                  <ImageOff className="h-4 w-4 mr-2" />
                  {deleteImageMutation.isPending ? "O'chirilmoqda..." : "Rasmni o'chirish"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Rasmni yuklash uchun bosing
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG — maks. 5 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && imageDialogId) {
                      uploadImageMutation.mutate({ id: imageDialogId, file });
                    }
                  }}
                />
                {uploadImageMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    Yuklanmoqda...
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogId(null)}>
              <X className="h-4 w-4 mr-2" />
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
