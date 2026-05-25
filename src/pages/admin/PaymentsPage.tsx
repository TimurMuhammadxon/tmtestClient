import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminPaymentsApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  Paid:      "success",
  Pending:   "secondary",
  Cancelled: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  Paid:      "To'langan",
  Pending:   "Kutilmoqda",
  Cancelled: "Bekor",
};

export function PaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: () => adminPaymentsApi.list({ page, pageSize: 30 }),
  });

  const totalPages = data ? Math.ceil(data.totalCount / 30) : 1;
  const totalPaidSum = data?.items
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amountTiyin, 0) ?? 0;

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">To'lovlar</h1>
          <p className="text-muted-foreground mt-1">Jami: {data?.totalCount ?? 0} ta buyurtma</p>
        </div>
        {totalPaidSum > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ushbu sahifada to'langan</p>
            <p className="text-lg font-bold text-green-600">
              {(totalPaidSum / 100).toLocaleString("ru-RU")} so'm
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Reja</TableHead>
                <TableHead className="w-36">Summa</TableHead>
                <TableHead className="w-28">Holat</TableHead>
                <TableHead className="w-36">Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.userEmail}</TableCell>
                  <TableCell className="text-sm">{p.planLabel}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {(p.amountTiyin / 100).toLocaleString("ru-RU")} so'm
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"} className="text-xs">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    To'lovlar yo'q
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
    </div>
  );
}
