import { api } from "./axios";
import {
  type TeacherApplicationDto,
  type SubscriptionPlanDto,
  type PagedResult,
} from "@/types";

// --- Topics ---
export interface TopicAdminDto {
  id: string;
  code: string;
  orderIndex: number;
  isDemo: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: Array<{ languageCode: string; name: string }>;
}

export const adminTopicsApi = {
  list: (params?: { page?: number; pageSize?: number; includeTranslations?: boolean }) =>
    api.get<PagedResult<TopicAdminDto>>("/admin/topics", { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<TopicAdminDto>(`/admin/topics/${id}`).then((r) => r.data),

  create: (data: {
    code: string;
    orderIndex: number;
    isDemo: boolean;
    translations: Array<{ languageCode: string; name: string }>;
  }) => api.post<{ id: string }>("/admin/topics", data).then((r) => r.data),

  update: (id: string, data: { code: string; orderIndex: number; isDemo: boolean }) =>
    api.put(`/admin/topics/${id}`, data),

  upsertTranslation: (id: string, lang: string, name: string) =>
    api.patch(`/admin/topics/${id}/translations/${lang}`, { name }),

  delete: (id: string) =>
    api.delete(`/admin/topics/${id}`),

  activate: (id: string) => api.post(`/admin/topics/${id}/activate`),
  deactivate: (id: string) => api.post(`/admin/topics/${id}/deactivate`),
};

// --- Questions ---
export interface QuestionAdminListItemDto {
  id: string;
  topicId: string;
  imageKey?: string;
  imageUrl?: string;
  isActive: boolean;
  defaultText: string;
  answersCount: number;
}

export interface AnswerAdminDto {
  id: string;
  orderIndex: number;
  isCorrect: boolean;
  translations: Array<{ languageCode: string; text: string }>;
}

export interface QuestionAdminDto {
  id: string;
  topicId: string;
  imageKey?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Array<{ languageCode: string; text: string; explanation?: string }>;
  answers: AnswerAdminDto[];
}

export interface AnswerInput {
  orderIndex: number;
  isCorrect: boolean;
  translations: Array<{ languageCode: string; text: string }>;
}

export const adminQuestionsApi = {
  list: (params?: { topicId?: string; search?: string; page?: number; pageSize?: number }) =>
    api
      .get<PagedResult<QuestionAdminListItemDto>>("/admin/questions", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<QuestionAdminDto>(`/admin/questions/${id}`).then((r) => r.data),

  create: (data: {
    topicId: string;
    imageKey?: string;
    translations: Array<{ languageCode: string; text: string; explanation?: string }>;
    answers: AnswerInput[];
  }) => api.post<{ id: string }>("/admin/questions", data).then((r) => r.data),

  update: (id: string, data: { topicId: string; imageKey?: string; answers: AnswerInput[] }) =>
    api.put(`/admin/questions/${id}`, data),

  upsertTranslation: (id: string, lang: string, text: string, explanation?: string) =>
    api.patch(`/admin/questions/${id}/translations/${lang}`, { text, explanation }),

  delete: (id: string) => api.delete(`/admin/questions/${id}`),

  activate: (id: string) => api.post(`/admin/questions/${id}/activate`),
  deactivate: (id: string) => api.post(`/admin/questions/${id}/deactivate`),

  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ imageUrl: string; imageKey: string }>(`/admin/questions/${id}/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteImage: (id: string) => api.delete(`/admin/questions/${id}/image`),
};

// --- Teacher applications ---
export const adminApplicationsApi = {
  list: (status?: string) =>
    api
      .get<TeacherApplicationDto[]>("/admin/teacher-applications", { params: { status } })
      .then((r) => r.data),

  approve: (id: string) => api.post(`/admin/teacher-applications/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post(`/admin/teacher-applications/${id}/reject`, { reason }),
};

// --- Subscription plans ---
export const adminPlansApi = {
  list: () =>
    api.get<SubscriptionPlanDto[]>("/admin/subscription-plans").then((r) => r.data),

  setPlanPrice: (id: string, price: number) =>
    api.patch(`/admin/subscription-plans/${id}`, { price }),

  togglePlan: (id: string) =>
    api.patch(`/admin/subscription-plans/${id}`, { toggleActive: true }),

  grantSubscription: (userId: string, planId: string, note?: string) =>
    api.post(`/admin/users/${userId}/subscription`, { planId, note }),
};
