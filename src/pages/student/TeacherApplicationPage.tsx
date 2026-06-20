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
import { useTranslation } from "@/lib/i18n";
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
  const t = useTranslation();
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
      toast({ title: t.submitApplication });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? (e as any)?.response?.data?.title;
      toast({ variant: "destructive", title: msg ?? t.error });
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
            {t.applyTeacherTitle}
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.fullName} *</Label>
            <Input id="fullName" placeholder="Abdullayev Abdulla" {...field("fullName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t.phoneNumber} *</Label>
            <Input id="phoneNumber" placeholder="+998 90 123 45 67" {...field("phoneNumber")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramUsername">Telegram username</Label>
            <Input id="telegramUsername" placeholder="@username" {...field("telegramUsername")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">{t.organizationName}</Label>
            <Input id="organizationName" {...field("organizationName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceText">{t.name}</Label>
            <Textarea id="experienceText" rows={4} {...field("experienceText")} />
          </div>

          <div className="flex gap-2">
            {resubmitting && (
              <Button variant="outline" className="flex-1" onClick={() => setResubmitting(false)}>
                {t.cancel}
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => submitMutation.mutate(form)}
              disabled={!form.fullName.trim() || !form.phoneNumber.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? t.loading : t.submitApplication}
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
  const t = useTranslation();

  const config = {
    Pending: {
      icon: Clock,
      color: "text-amber-400",
      bgStyle: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" },
      badge: <Badge variant="secondary">{t.pending}</Badge>,
      title: t.applicationPending,
      desc: "",
    },
    Approved: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bgStyle: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" },
      badge: <Badge variant="success">{t.approved}</Badge>,
      title: t.applicationApproved,
      desc: "",
    },
    Rejected: {
      icon: XCircle,
      color: "text-red-400",
      bgStyle: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" },
      badge: <Badge variant="destructive">{t.rejected}</Badge>,
      title: t.applicationRejected,
      desc: app.rejectionReason ?? "",
    },
  }[app.status];

  const Icon = config.icon;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.applyTeacher}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 p-4 rounded-lg mb-5" style={config.bgStyle}>
            <Icon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${config.color}`} />
            <div>
              <p className="font-semibold">{config.title}</p>
              {config.desc && <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>}
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <Row label={t.status} value={config.badge} />
            <Row label={t.fullName} value={app.fullName} />
            <Row label={t.phoneNumber} value={app.phoneNumber} />
            {app.telegramUsername && <Row label="Telegram" value={app.telegramUsername} />}
            {app.organizationName && <Row label={t.organizationName} value={app.organizationName} />}
            <Row label={t.createdAt} value={format(new Date(app.submittedAt), "dd.MM.yyyy HH:mm")} />
            {app.reviewedAt && (
              <Row label={t.approved} value={format(new Date(app.reviewedAt), "dd.MM.yyyy HH:mm")} />
            )}
          </dl>

          {app.status === "Rejected" && onResubmit && (
            <div className="mt-5 pt-4 border-t">
              <Button className="w-full" onClick={onResubmit}>{t.submitApplication}</Button>
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
