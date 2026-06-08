import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { biletsApi } from "@/api/bilets";
import { attemptsApi } from "@/api/attempts";
import { subscriptionsApi } from "@/api/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { useAuthStore } from "@/store/auth";
import { BookOpen, ChevronLeft, Play, Link2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { PublicBiletListItemDto } from "@/types";

export function BiletsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPrivileged = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const isTeacher = isPrivileged;
  const [starting, setStarting] = useState<string | null>(null);
  const [linkBilet, setLinkBilet] = useState<PublicBiletListItemDto | null>(null);
  const [subModal, setSubModal] = useState(false);

  const { data: bilets, isLoading } = useQuery({
    queryKey: ["bilets"],
    queryFn: biletsApi.list,
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: subscriptionsApi.getMy,
    enabled: !isPrivileged,
    retry: false,
  });

  const hasAccess = isPrivileged || subscription?.isActive === true;

  const handleStart = async (bilet: PublicBiletListItemDto) => {
    if (starting) return;
    if (!bilet.isDemo && !hasAccess) { setSubModal(true); return; }
    setStarting(bilet.id);
    try {
      const { id } = await attemptsApi.start({ flowType: 1, biletId: bilet.id });
      navigate(`/attempts/${id}`);
    } catch (e: unknown) {
      const data = (e as any)?.response?.data;
      toast({ variant: "destructive", title: data?.detail ?? data?.title ?? "Test boshlanmadi." });
    } finally {
      setStarting(null);
    }
  };

  if (isLoading) return <PageLoader />;

  const allBilets = bilets ?? [];
  const demoBilets = allBilets.filter((b) => b.isDemo);
  const regularBilets = allBilets.filter((b) => !b.isDemo);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Biletlar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {allBilets.length} ta bilet · Biletni tanlang va testni boshlang
          </p>
        </div>
      </div>

      {allBilets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Hozircha faol biletlar yo'q</p>
          </CardContent>
        </Card>
      )}

      {demoBilets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Demo biletlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoBilets.map((bilet) => (
              <BiletCard
                key={bilet.id}
                bilet={bilet}
                isLoading={starting === bilet.id}
                disabled={!!starting}
                isTeacher={!!isTeacher}
                locked={false}
                onClick={() => handleStart(bilet)}
                onCreateLink={() => setLinkBilet(bilet)}
              />
            ))}
          </div>
        </section>
      )}

      {regularBilets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Barcha biletlar ({regularBilets.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularBilets.map((bilet) => (
              <BiletCard
                key={bilet.id}
                bilet={bilet}
                isLoading={starting === bilet.id}
                disabled={!!starting}
                isTeacher={!!isTeacher}
                locked={!hasAccess}
                onClick={() => handleStart(bilet)}
                onCreateLink={() => setLinkBilet(bilet)}
              />
            ))}
          </div>
        </section>
      )}

      {linkBilet && (
        <CreateTestLinkDialog
          open={!!linkBilet}
          onClose={() => setLinkBilet(null)}
          defaultTitle={`Bilet #${linkBilet.number}`}
          flowType={1}
          biletId={linkBilet.id}
        />
      )}

      {subModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSubModal(false)}
        >
          <div
            style={{ background: "#111117", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 40, maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.6)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 56, height: 56, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8, fontFamily: "inherit" }}>Obuna kerak</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6, fontFamily: "inherit" }}>
              Bu biletdan foydalanish uchun faol obuna kerak. Demo bilet bepul!
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setSubModal(false)} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>Yopish</button>
              <button onClick={() => { setSubModal(false); navigate("/subscription"); }} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: "#0a0a0f", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Obuna olish →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BiletCard({
  bilet, isLoading, disabled, isTeacher, locked, onClick, onCreateLink,
}: {
  bilet: PublicBiletListItemDto;
  isLoading: boolean;
  disabled: boolean;
  isTeacher: boolean;
  locked: boolean;
  onClick: () => void;
  onCreateLink: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
        locked ? "hover:border-amber-500/30" : "hover:border-primary/40",
        isLoading && "opacity-70 pointer-events-none",
        disabled && !isLoading && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", locked ? "bg-amber-500/10" : "bg-primary/10")}>
            <span className={cn("text-sm font-bold", locked ? "text-amber-500" : "text-primary")}>{bilet.number}</span>
          </div>
          <div className="flex items-center gap-1">
            {bilet.isDemo && <Badge variant="default" className="text-xs">Demo</Badge>}
            {isTeacher && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => { e.stopPropagation(); onCreateLink(); }}
                title="Havola yaratish"
              >
                <Link2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className="font-medium">Bilet #{bilet.number}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{bilet.questionCount} ta savol</p>
        </div>

        <div className={cn("flex items-center gap-1.5 text-xs font-medium", locked ? "text-amber-500" : "text-primary")}>
          {locked ? <Lock className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isLoading ? "Yuklanmoqda..." : locked ? "Obuna kerak" : "Boshlash"}
        </div>
      </CardContent>
    </Card>
  );
}
