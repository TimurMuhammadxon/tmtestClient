import { api } from "./axios";
import {
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
export interface AnswerListItemDto {
  id: string;
  orderIndex: number;
  isCorrect: boolean;
  text: string;
}

export interface QuestionAdminListItemDto {
  id: string;
  topicId: string;
  imageKey?: string;
  imageUrl?: string;
  isActive: boolean;
  defaultText: string;
  answers: AnswerListItemDto[];
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

// --- Bilets ---
export interface BiletListItemDto {
  id: string;
  number: number;
  isDemo: boolean;
  isActive: boolean;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BiletAnswerDto {
  id: string;
  orderIndex: number;
  text: string;
  language: string;
  isFallback: boolean;
  isCorrect: boolean;
}

export interface BiletQuestionDto {
  orderIndex: number;
  questionId: string;
  imageKey?: string;
  text: string;
  explanation?: string;
  language: string;
  isFallback: boolean;
  answers: BiletAnswerDto[];
}

export interface BiletDetailsDto {
  id: string;
  number: number;
  isDemo: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: BiletQuestionDto[];
}

export const adminBiletsApi = {
  list: (params?: { isActive?: boolean; isDemo?: boolean; page?: number; pageSize?: number }) =>
    api.get<PagedResult<BiletListItemDto>>("/admin/bilets", { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<BiletDetailsDto>(`/admin/bilets/${id}`).then((r) => r.data),

  create: (data: { number: number; questionIds: string[]; isDemo: boolean }) =>
    api.post<{ id: string }>("/admin/bilets", data).then((r) => r.data),

  update: (id: string, questionIds: string[]) =>
    api.put(`/admin/bilets/${id}`, { questionIds }),

  delete: (id: string) => api.delete(`/admin/bilets/${id}`),

  activate: (id: string) => api.post(`/admin/bilets/${id}/activate`),
  deactivate: (id: string) => api.post(`/admin/bilets/${id}/deactivate`),
  markDemo: (id: string) => api.post(`/admin/bilets/${id}/mark-demo`),
  unmarkDemo: (id: string) => api.post(`/admin/bilets/${id}/unmark-demo`),
};

// --- Teacher applications (admin view) ---
export interface ApplicationListItemDto {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  phoneNumber: string;
  organizationName?: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
}

export const adminApplicationsApi = {
  list: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api
      .get<PagedResult<ApplicationListItemDto>>("/admin/teacher-applications", { params })
      .then((r) => r.data),

  approve: (id: string) => api.post(`/admin/teacher-applications/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post(`/admin/teacher-applications/${id}/reject`, { reason }),
};

// --- Users (Owner) ---
export interface UserAdminDto {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscriptionExpiresAt?: string;
}

export const adminUsersApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<UserAdminDto>>("/admin/users", { params }).then((r) => r.data),

  grantSubscription: (userId: string, planId: string) =>
    api.post(`/admin/users/${userId}/subscription`, { planId }),
};

// --- Payments (Owner) ---
export interface PaymentOrderAdminDto {
  id: string;
  userEmail: string;
  planLabel: string;
  amountTiyin: number;
  status: string;
  createdAt: string;
}

export const adminPaymentsApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    api.get<PagedResult<PaymentOrderAdminDto>>("/admin/payments", { params }).then((r) => r.data),
};

// --- Subscription plans ---
export const adminPlansApi = {
  list: () =>
    api.get<SubscriptionPlanDto[]>("/admin/subscription-plans").then((r) => r.data),

  setPlanPrice: (id: string, price: number) =>
    api.patch(`/admin/subscription-plans/${id}/price`, { price }),

  togglePlan: (id: string, isActive: boolean) =>
    api.patch(`/admin/subscription-plans/${id}/toggle`, { isActive }),

  grantSubscription: (userId: string, planId: string) =>
    api.post(`/admin/users/${userId}/subscription`, { planId }),
};
