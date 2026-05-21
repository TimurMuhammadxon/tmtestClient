import { api } from "./axios";
import { type PublicBiletListItemDto, type PublicBiletDetailsDto } from "@/types";

export const biletsApi = {
  list: () =>
    api.get<PublicBiletListItemDto[]>("/bilets").then((r) => r.data),

  getById: (id: string) =>
    api.get<PublicBiletDetailsDto>(`/bilets/${id}`).then((r) => r.data),
};
