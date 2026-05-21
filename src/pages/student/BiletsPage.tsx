import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { biletsApi } from "@/api/bilets";
import { attemptsApi } from "@/api/attempts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { t } from "@/lib/i18n";
import { BookOpen, Play } from "lucide-react";
import { useState } from "react";

export function BiletsPage() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState<string | null>(null);

  const { data: bilets, isLoading } = useQuery({
    queryKey: ["bilets"],
    queryFn: biletsApi.list,
  });

  const handleStart = async (biletId: string) => {
    setStarting(biletId);
    try {
      const { id } = await attemptsApi.start({ flowType: 1, biletId });
      navigate(`/attempts/${id}`);
    } finally {
      setStarting(null);
    }
  };

  if (isLoading) return <PageLoader />;

  const activeBilets = bilets?.filter((b) => b.isActive) ?? [];
  const demoBilet = bilets?.find((b) => b.isDemo);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.bilets}</h1>
        <p className="text-muted-foreground mt-1">
          Yo'l harakati qoidalari bo'yicha biletlar
        </p>
      </div>

      {/* Demo bilet */}
      {demoBilet && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Demo bilet
          </h2>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Bilet #{demoBilet.number}</span>
                    <Badge variant="default">Demo</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{t.questions20}</span>
                </div>
              </div>
              <Button
                onClick={() => handleStart(demoBilet.id)}
                disabled={starting === demoBilet.id}
              >
                <Play className="h-4 w-4 mr-2" />
                {starting === demoBilet.id ? t.loading : t.startTest}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All bilets */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Barcha biletlar ({activeBilets.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeBilets.map((bilet) => (
            <Card key={bilet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="font-bold text-sm">{bilet.number}</span>
                  </div>
                  <div className="flex gap-1">
                    {bilet.isDemo && <Badge variant="default" className="text-xs">Demo</Badge>}
                    <Badge variant="success" className="text-xs">Faol</Badge>
                  </div>
                </div>
                <p className="font-medium mb-1">Bilet #{bilet.number}</p>
                <p className="text-sm text-muted-foreground mb-4">{bilet.questionCount} ta savol</p>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleStart(bilet.id)}
                  disabled={starting === bilet.id}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {starting === bilet.id ? t.loading : t.startTest}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeBilets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Hozircha faol biletlar yo'q</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
