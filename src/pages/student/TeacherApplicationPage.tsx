import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApplicationApi, type SubmitApplicationInput } from "@/api/teacherApplication";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, GraduationCap } from "lucide-react";
import { useState } from "react";

const emptyForm = (): SubmitApplicationInput => ({
  fullName: "",
  phoneNumber: "",
  telegramUsername: "",
  organizationName: "",
  experienceText: "",
  additionalNotes: "",
});

export function TeacherApplicationPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SubmitApplicationInput>(emptyForm());
  const [resubmitting, setResubmitting] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-teacher-application"],
    queryFn: () => teacherApplicationApi.getMy(),
  });

  const submitMutation = useMutation({
    mutationFn: teacherApplicationApi.submit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teacher-application"] });
      setResubmitting(false);
      toast({ title: "Ariza yuborildi! Ko'rib chiqamiz." });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? "Xatolik yuz berdi" });
    },
  });

  if (isLoading) return <PageLoader />;

  if (existing && !(existing.status === "Rejected" && resubmitting)) {
    return (
      <ApplicationStatus
        app={existing}
        onResubmit={() => {
          setForm({
            fullName: existing.fullName,
            phoneNumber: existing.phoneNumber,
            telegramUsername: existing.telegramUsername ?? "",
            organizationName: existing.organizationName ?? "",
            experienceText: existing.experienceText ?? "",
            additionalNotes: existing.additionalNotes ?? "",
          });
          setResubmitting(true);
        }}
      />
    );
  }

  const field = (key: keyof SubmitApplicationInput) => ({
    value: form[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {resubmitting ? "Arizani qayta yuborish" : "O'qituvchi bo'lish"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {resubmitting
              ? "Ma'lumotlarni yangilab arizani qayta yuboring"
              : "Ariza qoldiring — ko'rib chiqqach siz bilan bog'lanamiz"}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Ism va familiya *</Label>
            <Input id="fullName" placeholder="Abdullayev Abdulla" {...field("fullName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefon raqami *</Label>
            <Input id="phoneNumber" placeholder="+998 90 123 45 67" {...field("phoneNumber")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramUsername">Telegram username</Label>
            <Input id="telegramUsername" placeholder="@username" {...field("telegramUsername")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">Tashkilot nomi</Label>
            <Input
              id="organizationName"
              placeholder="Haydovchilik maktabi nomi"
              {...field("organizationName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceText">Tajriba va malaka</Label>
            <Textarea
              id="experienceText"
              placeholder="Haydovchilik tajribangiz, o'qituvchilik tajribangiz haqida yozing..."
              rows={4}
              {...field("experienceText")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Qo'shimcha ma'lumot</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Boshqa aytmoqchi bo'lgan narsalaringiz..."
              rows={3}
              {...field("additionalNotes")}
            />
          </div>

          <div className="flex gap-2">
            {resubmitting && (
              <Button variant="outline" className="flex-1" onClick={() => setResubmitting(false)}>
                Bekor qilish
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => submitMutation.mutate(form)}
              disabled={!form.fullName.trim() || !form.phoneNumber.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Yuborilmoqda..." : resubmitting ? "Qayta yuborish" : "Ariza yuborish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationStatus({
  app,
  onResubmit,
}: {
  app: NonNullable<Awaited<ReturnType<typeof teacherApplicationApi.getMy>>>;
  onResubmit?: () => void;
}) {
  const config = {
    Pending: {
      icon: Clock,
      color: "text-amber-400",
      bg: "",
      bgStyle: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" },
      badge: <Badge variant="secondary">Ko'rib chiqilmoqda</Badge>,
      title: "Arizangiz ko'rib chiqilmoqda",
      desc: "Tez orada siz bilan bog'lanamiz.",
    },
    Approved: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "",
      bgStyle: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" },
      badge: <Badge variant="success">Tasdiqlandi</Badge>,
      title: "Tabriklaymiz! Arizangiz tasdiqlandi",
      desc: "Endi o'qituvchi sifatida guruh va test havolalar yaratishingiz mumkin.",
    },
    Rejected: {
      icon: XCircle,
      color: "text-red-400",
      bg: "",
      bgStyle: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" },
      badge: <Badge variant="destructive">Rad etildi</Badge>,
      title: "Ariza rad etildi",
      desc: app.rejectionReason ?? "Batafsil ma'lumot uchun administrator bilan bog'laning.",
    },
  }[app.status];

  const Icon = config.icon;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">O'qituvchi arizasi</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 p-4 rounded-lg mb-5" style={config.bgStyle}>
            <Icon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${config.color}`} />
            <div>
              <p className="font-semibold">{config.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <Row label="Holat" value={config.badge} />
            <Row label="Ism" value={app.fullName} />
            <Row label="Telefon" value={app.phoneNumber} />
            {app.telegramUsername && <Row label="Telegram" value={app.telegramUsername} />}
            {app.organizationName && <Row label="Tashkilot" value={app.organizationName} />}
            <Row
              label="Yuborilgan sana"
              value={format(new Date(app.submittedAt), "dd.MM.yyyy HH:mm")}
            />
            {app.reviewedAt && (
              <Row
                label="Ko'rib chiqilgan"
                value={format(new Date(app.reviewedAt), "dd.MM.yyyy HH:mm")}
              />
            )}
          </dl>

          {app.status === "Rejected" && onResubmit && (
            <div className="mt-5 pt-4 border-t">
              <Button className="w-full" onClick={onResubmit}>
                Qayta ariza yuborish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground flex-shrink-0">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
