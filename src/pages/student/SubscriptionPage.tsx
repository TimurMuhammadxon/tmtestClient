import { useQuery } from "@tanstack/react-query";
import { subscriptionsApi } from "@/api/subscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { getDurationLabel, useTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import {
  CheckCircle,
  Shield,
  Star,
  GraduationCap,
  Users,
  Link2,
  BarChart3,
  BookOpen,
  Zap,
  CalendarCheck,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanDto } from "@/types";

function PricingCard({
  plan,
  isPopular,
  onPayme,
  onClickPay,
}: {
  plan: SubscriptionPlanDto;
  isPopular: boolean;
  onPayme: () => void;
  onClickPay: () => void;
}) {
  const t = useTranslation();
  const [paying, setPaying] = useState<"payme" | "click" | null>(null);

  const STUDENT_FEATURES = [
    { icon: BookOpen, label: t.allBiletsAccess },
    { icon: Zap, label: t.unlimitedTests },
    { icon: CalendarCheck, label: t.examModeFeature },
    { icon: BarChart3, label: t.errorAnalytics },
  ];

  const TEACHER_FEATURES = [
    ...STUDENT_FEATURES,
    { icon: Users, label: t.groupManagement },
    { icon: Link2, label: t.createTestLinksFeature },
    { icon: BarChart3, label: t.studentResults },
  ];

  const features = plan.type === "Teacher" ? TEACHER_FEATURES : STUDENT_FEATURES;

  const handlePayme = async () => {
    setPaying("payme");
    try { onPayme(); } finally { setPaying(null); }
  };
  const handleClick = async () => {
    setPaying("click");
    try { onClickPay(); } finally { setPaying(null); }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border flex flex-col gap-5 p-6 transition-all duration-200 hover:shadow-lg",
        isPopular
          ? "border-primary shadow-md bg-gradient-to-b from-primary/8 to-primary/3"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            {t.mostPopular}
          </span>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {getDurationLabel(plan.duration)}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold tracking-tight leading-none">
            {plan.price.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm mb-0.5">{t.uzs}</span>
        </div>
      </div>

      <ul className="space-y-2.5 flex-1">
        {features.map(({ label }, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
              isPopular ? "bg-primary/15" : "bg-muted"
            )}>
              <CheckCircle className={cn("h-3 w-3", isPopular ? "text-primary" : "text-muted-foreground")} />
            </div>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2 pt-1">
        <Button
          className="w-full font-semibold bg-[#00AEFF] hover:bg-[#0092d9] text-white border-0"
          onClick={handlePayme}
          disabled={paying !== null}
        >
          {paying === "payme" ? t.redirecting : "Payme"}
        </Button>
        <Button
          className="w-full font-semibold bg-[#57A826] hover:bg-[#4a9020] text-white border-0"
          onClick={handleClick}
          disabled={paying !== null}
        >
          {paying === "click" ? t.redirecting : "Click"}
        </Button>
      </div>
    </div>
  );
}

function PlansGrid({
  plans,
  onPayme,
  onClickPay,
}: {
  plans: SubscriptionPlanDto[];
  onPayme: (id: string) => void;
  onClickPay: (id: string) => void;
}) {
  const t = useTranslation();
  if (plans.length === 0)
    return (
      <div className="text-center py-16 text-muted-foreground">
        {t.noActivePlans}
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {plans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          isPopular={plan.duration === "OneMonth"}
          onPayme={() => onPayme(plan.id)}
          onClickPay={() => onClickPay(plan.id)}
        />
      ))}
    </div>
  );
}

export function SubscriptionPage() {
  const t = useTranslation();

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["plans"],
    queryFn: subscriptionsApi.getPlans,
  });

  const { data: mySub, isLoading: loadingSub } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: subscriptionsApi.getMy,
  });

  const handlePayme = async (planId: string) => {
    try {
      const { checkoutUrl } = await subscriptionsApi.initiatePayme(planId);
      window.open(checkoutUrl, "_blank");
    } catch {
      alert(t.paymentError);
    }
  };

  const handleClick = async (planId: string) => {
    try {
      const { checkoutUrl } = await subscriptionsApi.initiateClick(planId);
      window.open(checkoutUrl, "_blank");
    } catch {
      alert(t.paymentError);
    }
  };

  if (loadingPlans || loadingSub) return <PageLoader />;

  const activePlans = plans?.filter((p) => p.isActive) ?? [];
  const studentPlans = activePlans.filter((p) => p.type === "Student");
  const teacherPlans = activePlans.filter((p) => p.type === "Teacher");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t.subscriptionPlans}</h1>
        <p className="text-muted-foreground">{t.choosePlan}</p>
      </div>

      {mySub ? (
        <div className={cn(
          "rounded-2xl border p-5 flex items-center gap-4",
          mySub.isActive
            ? "border-green-800/50 bg-green-950/20"
            : "border-orange-800/50 bg-orange-950/20"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            mySub.isActive ? "bg-green-900/50" : "bg-orange-900/50"
          )}>
            <Shield className={cn("h-6 w-6", mySub.isActive ? "text-green-600" : "text-orange-500")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{t.mySubscriptionLabel}</span>
              <Badge variant={mySub.isActive ? "success" : "destructive"}>
                {mySub.isActive ? t.active : t.expiredLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mySub.planType === "Teacher" ? t.teacherPlanLabel : t.studentPlanLabel} ·{" "}
              {getDurationLabel(mySub.planDuration)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">{t.expiryDate}</p>
            <p className="font-semibold">{format(new Date(mySub.expiresAt), "dd.MM.yyyy")}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-5 flex items-center gap-4 bg-muted/30">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{t.noActiveSubscription}</p>
            <p className="text-sm text-muted-foreground">{t.selectPlanBelow}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="student">
        <TabsList className="h-12 p-1 bg-muted rounded-xl w-full sm:w-auto">
          <TabsTrigger
            value="student"
            className="flex-1 sm:flex-none gap-2 rounded-lg data-[state=active]:shadow-sm h-10 px-6"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="font-medium">{t.students}</span>
            {studentPlans.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {studentPlans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="teacher"
            className="flex-1 sm:flex-none gap-2 rounded-lg data-[state=active]:shadow-sm h-10 px-6"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">{t.teachers}</span>
            {teacherPlans.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {teacherPlans.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
              <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t.studentPlanLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.studentPlanDesc}</p>
              </div>
            </div>
            <PlansGrid plans={studentPlans} onPayme={handlePayme} onClickPay={handleClick} />
          </div>
        </TabsContent>

        <TabsContent value="teacher">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t.teacherPlanLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.teacherPlanDesc}</p>
              </div>
            </div>
            <PlansGrid plans={teacherPlans} onPayme={handlePayme} onClickPay={handleClick} />
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground pb-4">
        {t.paymentSecure}
      </p>
    </div>
  );
}
