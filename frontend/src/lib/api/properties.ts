import { apiRequest } from "./client";

export interface CreatePropertyPayload {
  title: string;
  description: string;
  location: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  property_type_id: number;
  transaction_type_id: number;
  images?: string[];
  amenities?: Record<string, unknown>;
}

export interface PropertyFilters {
  location?: string;
  status?: string;
  property_type_id?: number;
  transaction_type_id?: number;
  page?: number;
  limit?: number;
}

export interface CreatePropertyPayload {
  title: string;
  description: string;
  location: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  property_type_id: number;
  transaction_type_id: number;
}

export const propertiesApi = {
  getAll: (filters: PropertyFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== "") params.append(key, String(val));
    });
    const query = params.toString();
    return apiRequest<Property[]>(`/properties${query ? `?${query}` : ""}`);
  },

  create: (data: CreatePropertyPayload, token: string) =>
    apiRequest<Property>("/properties", { method: "POST", body: data, token }),

  update: (id: string, data: Partial<CreatePropertyPayload>, token: string) =>
    apiRequest<Property>(`/properties/${id}`, { method: "PUT", body: data, token }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/properties/${id}`, { method: "DELETE", token }),
};