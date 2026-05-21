import { useQuery } from "@tanstack/react-query";
import { subscriptionsApi } from "@/api/subscriptions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t, getDurationLabel, getPlanTypeLabel } from "@/lib/i18n";
import { format } from "date-fns";
import { CheckCircle, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import type { SubscriptionPlanDto } from "@/types";

function PlanCard({ plan, onPayme, onClick }: { plan: SubscriptionPlanDto; onPayme: () => void; onClick: () => void }) {
  const [paying, setPaying] = useState<"payme" | "click" | null>(null);

  const handlePayme = async () => {
    setPaying("payme");
    try { onPayme(); } finally { setPaying(null); }
  };

  const handleClick = async () => {
    setPaying("click");
    try { onClick(); } finally { setPaying(null); }
  };

  return (
    <Card className={plan.type === "Teacher" ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{getPlanTypeLabel(plan.type)}</CardTitle>
            <CardDescription>{getDurationLabel(plan.duration)}</CardDescription>
          </div>
          {plan.type === "Teacher" && (
            <Badge variant="default">Professional</Badge>
          )}
        </div>
        <div className="text-3xl font-bold text-primary mt-2">
          {plan.price.toLocaleString()} <span className="text-base font-normal text-muted-foreground">{t.uzs}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Barcha biletlarga kirish
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Cheksiz test topshirish
          </li>
          {plan.type === "Teacher" && (
            <>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Guruhlar boshqaruvi
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Test havolalari yaratish
              </li>
            </>
          )}
        </ul>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            size="sm"
            className="bg-[#00AEFF] hover:bg-[#0090d4]"
            onClick={handlePayme}
            disabled={paying !== null}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            {paying === "payme" ? "..." : "Payme"}
          </Button>
          <Button
            size="sm"
            className="bg-[#57A826] hover:bg-[#4a9020]"
            onClick={handleClick}
            disabled={paying !== null}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            {paying === "click" ? "..." : "Click"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SubscriptionPage() {
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
      alert("To'lov sahifasini ochishda xatolik");
    }
  };

  const handleClick = async (planId: string) => {
    try {
      const { checkoutUrl } = await subscriptionsApi.initiateClick(planId);
      window.open(checkoutUrl, "_blank");
    } catch {
      alert("To'lov sahifasini ochishda xatolik");
    }
  };

  if (loadingPlans || loadingSub) return <PageLoader />;

  const activePlans = plans?.filter((p) => p.isActive) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.subscription}</h1>
        <p className="text-muted-foreground mt-1">Obuna olish va boshqarish</p>
      </div>

      {/* Current subscription */}
      {mySub ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{t.mySubscription}</span>
                  {mySub.isActive ? (
                    <Badge variant="success">Faol</Badge>
                  ) : (
                    <Badge variant="destructive">Muddati o'tgan</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPlanTypeLabel(mySub.planType)} · {getDurationLabel(mySub.planDuration)}
                </p>
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">{t.expiresAt}: </span>
                  <span className="font-medium">
                    {format(new Date(mySub.expiresAt), "dd.MM.yyyy")}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 p-5">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{t.noSubscription}</p>
              <p className="text-sm text-muted-foreground">
                Barcha biletlarga kirish uchun obuna oling
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-lg mb-4">{t.subscriptionPlans}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPayme={() => handlePayme(plan.id)}
              onClick={() => handleClick(plan.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
