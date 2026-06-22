import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { testLinksApi } from "@/api/testLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Copy, Check, Link2 } from "lucide-react";
import { addDays, format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultTitle: string;
  flowType: number;
  biletId?: string;
  topicIds?: string[];
}

export function CreateTestLinkDialog({ open, onClose, defaultTitle, flowType, biletId, topicIds }: Props) {
  const t = useTranslation();
  const [title, setTitle] = useState(defaultTitle);
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [expiresAt, setExpiresAt] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => testLinksApi.create({ title: title.trim() || defaultTitle, flowType, biletId, topicIds, maxAttempts: parseInt(maxAttempts) || 1, expiresAt: new Date(expiresAt).toISOString() }),
    onSuccess: (link) => setCreatedCode(link.code),
    onError: (e: unknown) => {
      const data = (e as any)?.response?.data;
      toast({ variant: "destructive", title: data?.detail ?? data?.title ?? t.error });
    },
  });

  const linkUrl = createdCode ? `${window.location.origin}/t/${createdCode}` : null;
  const telegramUrl = createdCode ? `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "pravadrive_bot"}/${import.meta.env.VITE_TELEGRAM_APP_NAME ?? "PravaDrive"}?startapp=${createdCode}` : null;
  const handleCopy = () => { if (!linkUrl) return; navigator.clipboard.writeText(linkUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleCopyTg = () => { if (!telegramUrl) return; navigator.clipboard.writeText(telegramUrl); setCopiedTg(true); setTimeout(() => setCopiedTg(false), 2000); };
  const handleClose = () => { setCreatedCode(null); setTitle(defaultTitle); setMaxAttempts("1"); setExpiresAt(format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {t.createTestLink}
          </DialogTitle>
        </DialogHeader>

        {createdCode ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-sm font-medium text-emerald-400">{t.linkCreated}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs rounded px-3 py-2 font-mono break-all" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,240,255,0.1)", color: "#00f0ff" }}>{linkUrl}</code>
                <Button size="icon" variant="outline" onClick={handleCopy} className="flex-shrink-0" title={t.copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyTg}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.65l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.909z"/></svg>
                {copiedTg ? t.copied : "Telegram"}
              </Button>
              <Button className="flex-1" onClick={handleClose}>{t.close}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="link-title">{t.title}</Label>
                <Input id="link-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-attempts">{t.attemptsCount}</Label>
                <Input id="max-attempts" type="number" min="1" max="100" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-at">{t.endTime}</Label>
                <Input id="expires-at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>{t.cancel}</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                <Link2 className="h-4 w-4 mr-2" />
                {createMutation.isPending ? t.creating : t.createTestLink}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
