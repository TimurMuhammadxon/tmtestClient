import { api } from "./axios";

export const profileApi = {
  update: (firstName: string | null, lastName: string | null) =>
    api.patch<{ firstName: string | null; lastName: string | null }>(
      "/users/me",
      { firstName, lastName }
    ).then((r) => r.data),
};
