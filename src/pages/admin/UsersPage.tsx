import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminUsersApi, adminPlansApi, adminStatsApi, type UserAdminDto } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Gift, Search } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  Owner:      "bg-purple-950/50 text-purple-400 border border-purple-800/30",
  SuperAdmin: "bg-red-950/50 text-red-400 border border-red-800/30",
  Admin:      "bg-orange-950/50 text-amber-400 border border-amber-800/30",
  Teacher:    "bg-blue-950/50 text-cyan-400 border border-cyan-800/30",
  Student:    "bg-slate-900/50 text-slate-400 border border-slate-700/30",
};

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [grantUser, setGrantUser] = useState<UserAdminDto | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminUsersApi.list({ search: search || undefined, page, pageSize: 20 }),
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: adminPlansApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminStatsApi.get,
  });
  const activePlans = plans?.filter((p) => p.isActive) ?? [];

  const grantMutation = useMutation({
    mutationFn: () => adminUsersApi.grantSubscription(grantUser!.id, selectedPlan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setGrantUser(null);
      toast({ title: "Obuna berildi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik yuz berdi" }),
  });

  const totalPages = data ? Math.ceil(data.totalCount / 20) : 1;

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platforma statistikasi</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Jami foydalanuvchilar", value: stats.totalUsers, sub: `+${stats.newUsersToday} bugun`, color: "#00f0ff" },
            { label: "Faol obunalar", value: stats.activeSubscriptions, sub: `${stats.paidOrders} to'lov`, color: "#10b981" },
            { label: "Jami urinishlar", value: stats.totalAttempts, sub: "barcha testlar", color: "#8b5cf6" },
            { label: "Daromad (so'm)", value: stats.totalRevenueSom.toLocaleString("uz-UZ"), sub: `${stats.newUsersThisWeek} ta yangi (hafta)`, color: "#f59e0b" },
          ].map((card, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Foydalanuvchilar</h2>
        <p className="text-muted-foreground mt-1 text-sm">Jami: {data?.totalCount ?? 0} ta</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Email bo'yicha qidirish..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => { setSearch(searchInput); setPage(1); }}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism Familiya</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-28">Rol</TableHead>
                <TableHead className="w-44">Obuna tugashi</TableHead>
                <TableHead className="w-40">Ro'yxatdan o'tgan</TableHead>
                <TableHead className="text-right w-24">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((u) => {
                const expired = u.subscriptionExpiresAt
                  ? new Date(u.subscriptionExpiresAt) < new Date()
                  : true;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{u.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? "bg-slate-900/50 text-slate-400"}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.subscriptionExpiresAt ? (
                        <Badge variant={expired ? "secondary" : "success"} className="text-xs">
                          {expired ? "Tugagan" : new Date(u.subscriptionExpiresAt).toLocaleDateString("ru-RU")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Yo'q</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Obuna berish"
                        onClick={() => { setGrantUser(u); setSelectedPlan(activePlans[0]?.id ?? ""); }}
                      >
                        <Gift className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Foydalanuvchilar topilmadi
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

      {/* Grant subscription dialog */}
      <Dialog open={!!grantUser} onOpenChange={(o) => !o && setGrantUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Obuna berish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-mono">{grantUser?.email}</p>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Reja tanlang" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.type} — {p.duration} ({p.price.toLocaleString()} so'm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantUser(null)}>Bekor</Button>
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={!selectedPlan || grantMutation.isPending}
            >
              {grantMutation.isPending ? "Berilmoqda..." : "Berish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
