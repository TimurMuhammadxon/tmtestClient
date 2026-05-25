import { api } from "./axios";

export interface TopicStudentDto {
  id: string;
  code: string;
  orderIndex: number;
  isDemo: boolean;
  name: string;
  language: string;
  isFallback: boolean;
}

export const topicsApi = {
  list: () => api.get<TopicStudentDto[]>("/topics").then((r) => r.data),
};
