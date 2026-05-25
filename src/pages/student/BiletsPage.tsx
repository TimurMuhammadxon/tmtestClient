import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { biletsApi } from "@/api/bilets";
import { attemptsApi } from "@/api/attempts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CreateTestLinkDialog } from "@/components/shared/CreateTestLinkDialog";
import { useAuthStore } from "@/store/auth";
import { BookOpen, ChevronLeft, Play, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { PublicBiletListItemDto } from "@/types";

export function BiletsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const [starting, setStarting] = useState<string | null>(null);
  const [linkBilet, setLinkBilet] = useState<PublicBiletListItemDto | null>(null);

  const { data: bilets, isLoading } = useQuery({
    queryKey: ["bilets"],
    queryFn: biletsApi.list,
  });

  const handleStart = async (biletId: string) => {
    if (starting) return;
    setStarting(biletId);
    try {
      const { id } = await attemptsApi.start({ flowType: 1, biletId });
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
                onClick={() => handleStart(bilet.id)}
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
                onClick={() => handleStart(bilet.id)}
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
    </div>
  );
}

function BiletCard({
  bilet, isLoading, disabled, isTeacher, onClick, onCreateLink,
}: {
  bilet: PublicBiletListItemDto;
  isLoading: boolean;
  disabled: boolean;
  isTeacher: boolean;
  onClick: () => void;
  onCreateLink: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40",
        isLoading && "opacity-70 pointer-events-none",
        disabled && !isLoading && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{bilet.number}</span>
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

        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Play className="h-3 w-3" />
          {isLoading ? "Yuklanmoqda..." : "Boshlash"}
        </div>
      </CardContent>
    </Card>
  );
}
