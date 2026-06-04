import { apiRequest } from "./client";
import { Property } from "./properties";

export const savedApi = {
  getAll: (token: string) =>
    apiRequest<Property[]>("/saved", { token }),

  save: (propertyId: string, token: string) =>
    apiRequest<{ message: string }>(`/saved/${propertyId}`, { method: "POST", token }),

  remove: (propertyId: string, token: string) =>
    apiRequest<{ message: string }>(`/saved/${propertyId}`, { method: "DELETE", token }),
};