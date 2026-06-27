import { api } from "./axios";
import {
  type TestLinkDto,
  type PublicTestLinkDto,
  type TestLinkResultsDto,
  type PagedResult,
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
  showExplanations?: boolean;
}

export const testLinksApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<PagedResult<TestLinkDto>>("/teacher/test-links", { params: { page, pageSize } }).then((r) => r.data),

  create: (req: CreateTestLinkRequest) =>
    api.post<TestLinkDto>("/teacher/test-links", req).then((r) => r.data),

  update: (id: string, req: { title: string; maxAttempts: number; expiresAt: string }) =>
    api.patch(`/teacher/test-links/${id}`, req),

  activate: (id: string) =>
    api.patch(`/teacher/test-links/${id}/activate`),

  deactivate: (id: string) =>
    api.patch(`/teacher/test-links/${id}/deactivate`),

  delete: (id: string) =>
    api.delete(`/teacher/test-links/${id}`),

  results: (id: string) =>
    api.get<TestLinkResultsDto>(`/teacher/test-links/${id}/results`).then((r) => r.data.results),

  getPublic: (code: string) =>
    api.get<PublicTestLinkDto>(`/test-links/${code}`).then((r) => r.data),

  start: (code: string) =>
    api.post<{ id: string }>(`/test-links/${code}/start`).then((r) => r.data),
};
