import { api } from "./axios";
import {
  type AttemptDto,
  type SubmitAnswerResult,
  type FinishAttemptResult,
} from "@/types";

export interface StartAttemptRequest {
  flowType: number;
  biletId?: string;
  topicIds?: string[];
  questionCount?: number;
}

export const attemptsApi = {
  start: (req: StartAttemptRequest) =>
    api.post<{ id: string }>("/attempts", req).then((r) => r.data),

  get: (id: string) =>
    api.get<AttemptDto>(`/attempts/${id}`).then((r) => r.data),

  answer: (id: string, questionId: string, answerId: string) =>
    api
      .post<SubmitAnswerResult>(`/attempts/${id}/answer`, { questionId, answerId })
      .then((r) => r.data),

  finish: (id: string) =>
    api.post<FinishAttemptResult>(`/attempts/${id}/finish`).then((r) => r.data),
};
