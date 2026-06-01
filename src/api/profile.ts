import { api } from "./axios";
import type { AuthResponse } from "@/types";

export const profileApi = {
  update: (firstName: string | null, lastName: string | null) =>
    api.patch<{ firstName: string | null; lastName: string | null }>(
      "/users/me",
      { firstName, lastName }
    ).then((r) => r.data),

  setCredentials: (email: string, password: string) =>
    api.post<AuthResponse>("/users/me/credentials", { email, password }).then((r) => r.data),
};
