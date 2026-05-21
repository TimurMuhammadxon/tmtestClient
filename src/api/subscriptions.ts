import { api } from "./axios";
import {
  type SubscriptionPlanDto,
  type MySubscriptionDto,
  type InitiatePaymentResponse,
} from "@/types";

export const subscriptionsApi = {
  getPlans: () =>
    api.get<SubscriptionPlanDto[]>("/subscriptions/plans").then((r) => r.data),

  getMy: () =>
    api.get<MySubscriptionDto | null>("/subscriptions/my").then((r) => r.data),

  initiatePayme: (planId: string) =>
    api
      .post<InitiatePaymentResponse>("/payments/payme/initiate", { planId })
      .then((r) => r.data),

  initiateClick: (planId: string) =>
    api
      .post<InitiatePaymentResponse>("/payments/click/initiate", { planId })
      .then((r) => r.data),
};
