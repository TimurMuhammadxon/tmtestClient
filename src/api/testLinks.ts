import { api } from "./axios";
import {
  type TestLinkDto,
  type PublicTestLinkDto,
  type TestLinkResultItemDto,
} from "@/types";

export interface CreateTestLinkRequest {
  title: string;
  flowType: number;
  biletId?: string;
  topicIds?: string[];
  questionCount?: number;
  groupId?: string;
  maxAttempts: number;
  expiresAt: string;
}

export const testLinksApi = {
  list: () =>
    api.get<TestLinkDto[]>("/teacher/test-links").then((r) => r.data),

  create: (req: CreateTestLinkRequest) =>
    api.post<TestLinkDto>("/teacher/test-links", req).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/teacher/test-links/${id}/deactivate`),

  results: (id: string) =>
    api.get<TestLinkResultItemDto[]>(`/teacher/test-links/${id}/results`).then((r) => r.data),

  getPublic: (code: string) =>
    api.get<PublicTestLinkDto>(`/test-links/${code}`).then((r) => r.data),

  start: (code: string) =>
    api.post<{ id: string }>(`/test-links/${code}/start`).then((r) => r.data),
};
