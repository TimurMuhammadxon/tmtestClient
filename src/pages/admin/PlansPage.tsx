import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPlansApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { getDurationLabel, useTranslation } from "@/lib/i18n";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { SubscriptionPlanDto } from "@/types";

export function PlansPage() {
  const t = useTranslation();
  const qc = useQueryClient();
  const [editPlan, setEditPlan] = useState<SubscriptionPlanDto | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: adminPlansApi.list,
  });

  const setPriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      adminPlansApi.setPlanPrice(id, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setEditPlan(null);
      toast({ title: "Narx yangilandi" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPlansApi.togglePlan(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      toast({ title: "Holat o'zgartirildi" });
    },
  });

  if (isLoading) return <PageLoader />;

  const studentPlans = plans?.filter((p) => p.type === "Student") ?? [];
  const teacherPlans = plans?.filter((p) => p.type === "Teacher") ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.plans}</h1>
        <p className="text-muted-foreground mt-1">Obuna tariflarini boshqaring</p>
      </div>

      {[
        { label: t.studentPlan, items: studentPlans },
        { label: t.teacherPlan, items: teacherPlans },
      ].map(({ label, items }) => (
        <div key={label}>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">{label}</h2>
          <div className="space-y-3">
            {items.map((plan: SubscriptionPlanDto) => (
              <Card key={plan.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{getDurationLabel(plan.duration)}</p>
                      <p className="text-sm text-muted-foreground">{plan.price.toLocaleString()} so'm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={plan.isActive ? "success" : "secondary"}>
                      {plan.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: plan.id, isActive: checked })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditPlan(plan);
                        setPriceInput(String(plan.price));
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Narx
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!editPlan} onOpenChange={(o) => !o && setEditPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Narxni o'zgartirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{t.price} (so'm)</Label>
            <Input
              type="number"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlan(null)}>{t.cancel}</Button>
            <Button
              onClick={() =>
                setPriceMutation.mutate({ id: editPlan!.id, price: parseFloat(priceInput) })
              }
              disabled={!priceInput || setPriceMutation.isPending}
            >
              {setPriceMutation.isPending ? t.loading : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
