"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle, Trash2, ImagePlus, X, GripVertical,
  Save, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  FileText, Lightbulb, Eye
} from "lucide-react";

type Role = "owner" | "superadmin" | "admin" | "instructor" | "student" | null;

interface AnswerOption {
  id: string;
  text: string;
  imageUrl: string;
}

interface Question {
  id: string;
  text: string;
  imageUrl: string;
  options: AnswerOption[];
  correctAnswerIndex: number;
  solution: string;
  solutionImageUrl: string;
  isOpen: boolean;
}

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const emptyOption = (): AnswerOption => ({ id: uid(), text: "", imageUrl: "" });

const emptyQuestion = (): Question => ({
  id: uid(),
  text: "",
  imageUrl: "",
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
  correctAnswerIndex: 0,
  solution: "",
  solutionImageUrl: "",
  isOpen: true,
});

export default function CreateTestPage() {
  const [role, setRole] = useState<Role>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = localStorage.getItem("role")?.toLowerCase() as Role;
    if (r) setRole(r);
  }, []);

  const allowed = role === "owner" || role === "superadmin" || role === "admin";

  // --- Helpers ---
  const updateQuestion = (qId: string, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...patch } : q)));
  };

  const updateOption = (qId: string, oId: string, patch: Partial<AnswerOption>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, ...patch } : o)) }
          : q
      )
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, options: [...q.options, emptyOption()] } : q))
    );
  };

  const removeOption = (qId: string, oId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = q.options.filter((o) => o.id !== oId);
        const ci = Math.min(q.correctAnswerIndex, newOpts.length - 1);
        return { ...q, options: newOpts, correctAnswerIndex: Math.max(ci, 0) };
      })
    );
  };

  const addQuestion = () => {
    // collapse all, add new open
    setQuestions((prev) => [...prev.map((q) => ({ ...q, isOpen: false })), emptyQuestion()]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleImageSelect = (callback: (url: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim()) { setError("Введите название теста"); return; }
    const invalid = questions.find((q) => !q.text.trim() || q.options.filter((o) => o.text.trim()).length < 2);
    if (invalid) { setError("Каждый вопрос должен иметь текст и минимум 2 варианта ответа"); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((q, qi) => ({
          order: qi + 1,
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options.map((o, oi) => ({ order: oi + 1, text: o.text, imageUrl: o.imageUrl })),
          correctAnswerIndex: q.correctAnswerIndex,
          solution: q.solution,
          solutionImageUrl: q.solutionImageUrl,
        })),
        createdBy: localStorage.getItem("userId") || "unknown",
        createdByRole: role,
      };

      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка сохранения");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Access guard ---
  if (!role) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!allowed) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Доступ запрещён</h2>
      <p className="text-gray-500 dark:text-gray-400">Только Owner, SuperAdmin и Admin могут создавать тесты.</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Создать тест</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Создайте тест с вопросами, ответами и решениями.</p>
      </div>

      {/* Test Title Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название теста"
            className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-zinc-700 focus:border-blue-500 outline-none pb-2 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
          />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание теста (необязательно)" rows={2}
            className="w-full bg-transparent border-b border-gray-200 dark:border-zinc-700 focus:border-blue-500 outline-none resize-none text-gray-600 dark:text-gray-300 placeholder-gray-400 text-sm transition-colors"
          />
        </div>
      </motion.div>

      {/* Questions */}
      <AnimatePresence>
        {questions.map((q, qIndex) => (
          <motion.div key={q.id}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden group"
          >
            {/* Question Header */}
            <button onClick={() => updateQuestion(q.id, { isOpen: !q.isOpen })}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                  {qIndex + 1}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-left truncate max-w-md">
                  {q.text || "Новый вопрос"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {questions.length > 1 && (
                  <span onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                )}
                {q.isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {/* Question Body */}
            <AnimatePresence>
              {q.isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-6 border-t border-gray-100 dark:border-zinc-800 pt-4">
                    {/* Question Text */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <FileText className="w-4 h-4" /> Текст вопроса
                      </label>
                      <textarea value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        placeholder="Введите вопрос..." rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none transition-all"
                      />
                      {/* Question Image */}
                      {q.imageUrl ? (
                        <div className="relative w-fit">
                          <img src={q.imageUrl} alt="" className="max-h-48 rounded-xl border border-gray-200 dark:border-zinc-700" />
                          <button onClick={() => updateQuestion(q.id, { imageUrl: "" })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                          ><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleImageSelect((url) => updateQuestion(q.id, { imageUrl: url }))}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/50 border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                        ><ImagePlus className="w-4 h-4" /> Добавить изображение к вопросу</button>
                      )}
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4" /> Варианты ответа
                      </label>
                      {q.options.map((opt, oIndex) => (
                        <div key={opt.id} className="flex items-start gap-3 group/opt">
                          {/* Radio for correct answer */}
                          <button onClick={() => updateQuestion(q.id, { correctAnswerIndex: oIndex })}
                            className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              q.correctAnswerIndex === oIndex
                                ? "border-green-500 bg-green-500 shadow-md shadow-green-500/30"
                                : "border-gray-300 dark:border-zinc-600 hover:border-green-400"
                            }`}
                          >
                            {q.correctAnswerIndex === oIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                          </button>

                          <div className="flex-1 space-y-2">
                            <input value={opt.text} onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                              placeholder={`Вариант ${oIndex + 1}`}
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                            />
                            {opt.imageUrl ? (
                              <div className="relative w-fit">
                                <img src={opt.imageUrl} alt="" className="max-h-28 rounded-lg border border-gray-200 dark:border-zinc-700" />
                                <button onClick={() => updateOption(q.id, opt.id, { imageUrl: "" })}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md text-xs"
                                ><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => handleImageSelect((url) => updateOption(q.id, opt.id, { imageUrl: url }))}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-blue-500 transition-colors"
                              ><ImagePlus className="w-3.5 h-3.5" /> Изображение</button>
                            )}
                          </div>

                          {q.options.length > 2 && (
                            <button onClick={() => removeOption(q.id, opt.id)}
                              className="mt-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                            ><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addOption(q.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                      ><PlusCircle className="w-4 h-4" /> Добавить вариант</button>
                    </div>

                    {/* Solution */}
                    <div className="space-y-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50 dark:border-amber-500/20">
                      <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                        <Lightbulb className="w-4 h-4" /> Решение / Объяснение
                      </label>
                      <textarea value={q.solution} onChange={(e) => updateQuestion(q.id, { solution: e.target.value })}
                        placeholder="Введите решение или объяснение правильного ответа..." rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-amber-200 dark:border-amber-500/30 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-none text-sm transition-all"
                      />
                      {q.solutionImageUrl ? (
                        <div className="relative w-fit">
                          <img src={q.solutionImageUrl} alt="" className="max-h-40 rounded-xl border border-amber-200 dark:border-amber-500/30" />
                          <button onClick={() => updateQuestion(q.id, { solutionImageUrl: "" })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                          ><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleImageSelect((url) => updateQuestion(q.id, { solutionImageUrl: url }))}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-white dark:bg-zinc-900/50 border border-dashed border-amber-300 dark:border-amber-500/30 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                        ><ImagePlus className="w-4 h-4" /> Добавить изображение к решению</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Question Button */}
      <motion.button onClick={addQuestion} whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-zinc-950 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all font-semibold"
      >
        <PlusCircle className="w-5 h-5" /> Добавить вопрос
      </motion.button>

      <div ref={bottomRef} />

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{questions.length} {questions.length === 1 ? "вопрос" : "вопросов"}</span>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {error && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-sm text-red-500 font-medium flex items-center gap-1.5"
                ><AlertCircle className="w-4 h-4" /> {error}</motion.span>
              )}
              {saved && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5"
                ><CheckCircle2 className="w-4 h-4" /> Тест сохранён!</motion.span>
              )}
            </AnimatePresence>
            <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить тест
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
