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
  ArrowRight,
  Clock,
  TrendingDown,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanDto } from "@/types";

// Июльская акция: реальная цена в 3 раза выше показанной → скидка 66%
const SALE_MULTIPLIER = 3;

function PricingCard({
  plan,
  isPopular,
  onPayme: _onPayme,
  onClickPay,
}: {
  plan: SubscriptionPlanDto;
  isPopular: boolean;
  onPayme: () => void;
  onClickPay: () => void;
}) {
  void _onPayme;
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

  const originalPrice = plan.price * SALE_MULTIPLIER;
  const savings = originalPrice - plan.price;
  const discountPercent = Math.floor((1 - 1 / SALE_MULTIPLIER) * 100);

  const handleClick = async () => {
    setPaying("click");
    try { onClickPay(); } finally { setPaying(null); }
  };

  return (
    <div
      className={cn(
        "relative rounded-3xl border flex flex-col gap-6 p-6 transition-all duration-300 will-change-transform",
        isPopular
          ? "border-primary/50 bg-gradient-to-b from-primary/[0.10] via-card to-card shadow-[0_0_60px_-15px_hsl(var(--primary)/0.55)] lg:scale-[1.05] hover:-translate-y-1.5 hover:shadow-[0_0_70px_-12px_hsl(var(--primary)/0.7)] z-10"
          : "border-border bg-card hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-primary/40">
            <Star className="h-3 w-3 fill-current" />
            {t.mostPopular}
          </span>
        </div>
      )}

      {/* ── Price block: hierarchy = badge → new price → old price ── */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {getDurationLabel(plan.duration)}
          </p>
          {/* 1st focal point: bold amber-gold badge, warm complement to cyan → maximum pop */}
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 py-1 text-[13px] font-extrabold leading-none text-neutral-900 shadow-[0_0_22px_-4px_rgba(251,146,60,0.75)]">
            −{discountPercent}%
          </span>
        </div>

        {/* 3rd focal point: old price, minimal weight */}
        <span className="block text-[13px] text-muted-foreground/70 line-through decoration-1">
          {originalPrice.toLocaleString()} {t.uzs}
        </span>

        {/* 2nd focal point: discounted price, largest element */}
        <div className="flex items-end gap-1.5 -mt-1">
          <span className="text-[2.75rem] font-extrabold tracking-tight leading-[0.95] text-foreground">
            {plan.price.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm mb-1.5">{t.uzs}</span>
        </div>

        {/* savings + urgency */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
            <TrendingDown className="h-3.5 w-3.5" />
            {savings.toLocaleString()} {t.uzs} {t.saveLabel}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-amber-400/90">
            <Clock className="h-3 w-3" />
            {t.saleBadge}
          </span>
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

      <div className="space-y-2.5 pt-1">
        <button
          onClick={handleClick}
          disabled={paying !== null}
          className={cn(
            "group w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all duration-200",
            "bg-[#57A826] hover:bg-[#4f9c22] shadow-lg shadow-[#57A826]/25",
            "hover:shadow-xl hover:shadow-[#57A826]/40 hover:-translate-y-0.5 active:translate-y-0",
            "disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-wait",
            isPopular && "ring-1 ring-white/10"
          )}
        >
          {paying === "click" ? (
            t.redirecting
          ) : (
            <>
              {t.subscribeNow}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <Button
          className="w-full h-9 text-xs font-medium bg-transparent border border-border text-muted-foreground hover:bg-transparent hover:text-muted-foreground opacity-60 cursor-not-allowed"
          disabled
        >
          Payme · {t.comingSoon}
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

      {mySub?.isTrial ? (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{t.trialActive}</span>
              <Badge variant="secondary">
                {t.trialHoursLeft.replace("{hours}", String(Math.max(0, Math.ceil((new Date(mySub.expiresAt).getTime() - Date.now()) / 3600000))))}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{t.selectPlanBelow}</p>
          </div>
        </div>
      ) : mySub ? (
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

      <div className="rounded-xl border border-border/50 bg-muted/20 p-5 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
        <span className="text-muted-foreground">{t.paymentQuestions}</span>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <a href="tel:+998999852570" className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            +998 99 985 25 70
          </a>
          <span className="text-muted-foreground/30">|</span>
          <a href="https://t.me/PravaDriveUz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.65l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.909z"/></svg>
            Telegram guruh
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">
        {t.paymentSecure}
      </p>
    </div>
  );
}
