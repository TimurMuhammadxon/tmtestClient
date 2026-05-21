import { api } from "./axios";
import { type GroupDto, type GroupMemberDto } from "@/types";

export const groupsApi = {
  list: () =>
    api.get<GroupDto[]>("/teacher/groups").then((r) => r.data),

  create: (name: string) =>
    api.post<GroupDto>("/teacher/groups", { name }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/teacher/groups/${id}`),

  getMembers: (id: string) =>
    api.get<GroupMemberDto[]>(`/teacher/groups/${id}/members`).then((r) => r.data),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/teacher/groups/${groupId}/members/${userId}`),

  join: (inviteCode: string) =>
    api.post("/groups/join", { inviteCode }),
};
