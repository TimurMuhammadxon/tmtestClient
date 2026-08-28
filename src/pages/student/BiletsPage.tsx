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
import { useTranslation } from "@/lib/i18n";
import { BookOpen, ChevronLeft, Link2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { PublicBiletListItemDto } from "@/types";

export function BiletsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const t = useTranslation();
  const isPrivileged = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const isTeacher = isPrivileged;
  const [starting, setStarting] = useState<string | null>(null);
  const [linkBilet, setLinkBilet] = useState<PublicBiletListItemDto | null>(null);
  const [subModal, setSubModal] = useState(false);

  const { data: bilets, isLoading } = useQuery({ queryKey: ["bilets"], queryFn: biletsApi.list });
  const { data: subscription } = useQuery({ queryKey: ["my-subscription"], queryFn: subscriptionsApi.getMy, enabled: !isPrivileged, retry: false });
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
      toast({ variant: "destructive", title: data?.detail ?? data?.title ?? t.testFailed });
    } finally { setStarting(null); }
  };

  if (isLoading) return <PageLoader />;
  const allBilets = bilets ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ChevronLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{t.bilets}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{allBilets.length} {t.bilets} · {t.selectBilet}</p>
        </div>
      </div>

      {allBilets.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t.noActiveBilets}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBilets.map((bilet) => (
            <BiletCard key={bilet.id} bilet={bilet} isLoading={starting === bilet.id} disabled={!!starting} isTeacher={!!isTeacher} locked={!bilet.isDemo && !hasAccess} onClick={() => handleStart(bilet)} onCreateLink={() => setLinkBilet(bilet)} />
          ))}
        </div>
      )}

      {linkBilet && <CreateTestLinkDialog open={!!linkBilet} onClose={() => setLinkBilet(null)} defaultTitle={`${t.bilet} #${linkBilet.number}`} flowType={1} biletId={linkBilet.id} />}

      {subModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} onClick={() => setSubModal(false)}>
          <div style={{ background: "#111117", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 40, maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.6)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <img src="/pravadrive-icon-obuna.svg" alt="" style={{ width: 56, height: 56, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8, fontFamily: "inherit" }}>{t.subscriptionRequired}</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.6, fontFamily: "inherit" }}>{t.subRequiredBilet}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setSubModal(false)} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{t.close}</button>
              <button onClick={() => { setSubModal(false); navigate("/subscription"); }} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#00f0ff,#6366f1)", border: "none", color: "#0a0a0f", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>{t.getSubscription} →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BiletCard({ bilet, isLoading, disabled, isTeacher, locked, onClick, onCreateLink }: {
  bilet: PublicBiletListItemDto; isLoading: boolean; disabled: boolean; isTeacher: boolean; locked: boolean; onClick: () => void; onCreateLink: () => void;
}) {
  const t = useTranslation();
  return (
    <Card className={cn("cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5", locked ? "hover:border-amber-500/30" : "hover:border-primary/40", isLoading && "opacity-70 pointer-events-none", disabled && !isLoading && "opacity-60")} onClick={onClick}>
      <CardContent className="relative p-6 min-h-[120px] flex items-center justify-center">
        {/* corner markers */}
        {locked && <Lock className="absolute top-3 left-3 h-4 w-4 text-amber-500" />}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {bilet.isDemo && <Badge variant="default" className="text-xs">Demo</Badge>}
          {isTeacher && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); onCreateLink(); }} title={t.createLink}>
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* centered big title */}
        <span className={cn("text-3xl font-bold tracking-tight", locked ? "text-amber-500" : "text-foreground")}>
          {isLoading ? t.loading : `${t.bilet} ${bilet.number}`}
        </span>
      </CardContent>
    </Card>
  );
}
