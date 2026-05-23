import { api } from "./axios";

export interface MyTeacherApplicationDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  telegramUsername?: string;
  organizationName?: string;
  experienceText?: string;
  additionalNotes?: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SubmitApplicationInput {
  fullName: string;
  phoneNumber: string;
  telegramUsername?: string;
  organizationName?: string;
  experienceText?: string;
  additionalNotes?: string;
}

export const teacherApplicationApi = {
  submit: (data: SubmitApplicationInput) =>
    api.post<{ id: string }>("/teacher-applications", data).then((r) => r.data),

  getMy: () =>
    api.get<MyTeacherApplicationDto | null>("/teacher-applications/my").then((r) => r.data),
};
