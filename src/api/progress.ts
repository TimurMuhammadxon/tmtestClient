import { api } from "./axios";
import {
  type DashboardDto,
  type TopicProgressDto,
  type ErrorAnalysisItemDto,
  type ErrorQuestionDetailDto,
  type AttemptHistoryItemDto,
  type PagedResult,
} from "@/types";

export const progressApi = {
  dashboard: () =>
    api.get<DashboardDto>("/progress/dashboard").then((r) => r.data),

  topics: () =>
    api.get<TopicProgressDto[]>("/progress/topics").then((r) => r.data),

  errors: () =>
    api.get<ErrorAnalysisItemDto[]>("/progress/errors").then((r) => r.data),

  errorDetail: (questionId: string) =>
    api.get<ErrorQuestionDetailDto>(`/progress/errors/${questionId}`).then((r) => r.data),

  history: (params?: { page?: number; pageSize?: number; flowType?: number }) =>
    api
      .get<PagedResult<AttemptHistoryItemDto>>("/progress/history", { params })
      .then((r) => r.data),
};
