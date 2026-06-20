import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type GroupMemberStatsDto } from "@/api/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";
import { Plus, Users, Copy, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import type { GroupDto, GroupMemberDto } from "@/types";

export function GroupsPage() {
  const t = useTranslation();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [membersGroupId, setMembersGroupId] = useState<string | null>(null);
  const [membersTab, setMembersTab] = useState<"list" | "stats">("list");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
  });

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["group-members", membersGroupId],
    queryFn: () => groupsApi.getMembers(membersGroupId!),
    enabled: !!membersGroupId,
  });

  const { data: memberStats, isLoading: loadingStats } = useQuery({
    queryKey: ["group-stats", membersGroupId],
    queryFn: () => groupsApi.getStats(membersGroupId!),
    enabled: !!membersGroupId && membersTab === "stats",
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => groupsApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      setCreateOpen(false);
      setGroupName("");
      toast({ title: "Guruh yaratildi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Guruh o'chirildi" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-members", membersGroupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "A'zo chiqarildi" });
    },
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t.copied });
  };

  if (isLoading) return <PageLoader />;

  const selectedGroup = groups?.find((g) => g.id === membersGroupId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.groups}</h1>
          <p className="text-muted-foreground mt-1">Guruhlaringizni boshqaring</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.createGroup}
        </Button>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((group: GroupDto) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{group.name}</CardTitle>
                <Badge variant={group.isActive ? "success" : "secondary"} className="text-xs">
                  {group.isActive ? "Faol" : "Nofaol"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{group.memberCount} a'zo</span>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <span className="text-sm font-mono flex-1">{group.inviteCode}</span>
                <button
                  onClick={() => copyInviteCode(group.inviteCode)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setMembersGroupId(group.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t.members}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`"${group.name}" guruhini o'chirishni tasdiqlaysizmi?`))
                      deleteMutation.mutate(group.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {groups?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Hali guruhlar yo'q. Birinchi guruhingizni yarating!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create group dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.createGroup}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.groupName}</Label>
              <Input
                placeholder="Masalan: A guruh"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t.cancel}</Button>
            <Button
              onClick={() => createMutation.mutate(groupName)}
              disabled={!groupName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? t.loading : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members dialog */}
      <Dialog open={!!membersGroupId} onOpenChange={(o) => { if (!o) { setMembersGroupId(null); setMembersTab("list"); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name} — {t.members}</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
            {(["list", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMembersTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  membersTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "list" ? "A'zolar" : "Statistika"}
              </button>
            ))}
          </div>

          {/* Members list */}
          {membersTab === "list" && (
            loadingMembers ? <PageLoader /> : (
              <div className="max-h-80 overflow-y-auto">
                {members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Qo'shilgan</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((m: GroupMemberDto) => (
                        <TableRow key={m.userId}>
                          <TableCell className="text-sm">{m.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(m.joinedAt), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => removeMemberMutation.mutate({ groupId: membersGroupId!, userId: m.userId })}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">A'zolar yo'q</p>
                )}
              </div>
            )
          )}

          {/* Stats */}
          {membersTab === "stats" && (
            loadingStats ? <PageLoader /> : (
              <div className="max-h-80 overflow-y-auto">
                {memberStats && memberStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>A'zo</TableHead>
                        <TableHead className="text-center">Urinishlar</TableHead>
                        <TableHead className="text-center">O'tdi</TableHead>
                        <TableHead className="text-center">Aniqlik</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberStats.map((m: GroupMemberStatsDto) => (
                        <TableRow key={m.userId}>
                          <TableCell>
                            <div className="text-sm font-medium">{m.displayName ?? m.email.split("@")[0]}</div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{m.totalAttempts}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={m.passedAttempts > 0 ? "success" : "secondary"} className="text-xs">
                              {m.passedAttempts}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {m.avgAccuracyPercent !== null ? (
                              <span className={`text-sm font-medium ${
                                m.avgAccuracyPercent >= 80 ? "text-emerald-500" :
                                m.avgAccuracyPercent >= 60 ? "text-amber-500" : "text-red-500"
                              }`}>
                                {m.avgAccuracyPercent}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Hali test natijalari yo'q. Test havolalarini guruh bilan bog'lang.
                  </p>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
