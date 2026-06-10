import { apiRequest } from "./client";

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  status?: string;
  property_type_id?: number;
  transaction_type_id?: number;
  images: string[];
  amenities?: Record<string, unknown>;
  currency?: string;
  mortgage_available?: boolean;
  mortgage_rate?: number;
  mortgage_term?: number;
  is_featured?: boolean;
  featured_until?: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at?: string;
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
  images?: string[];
  amenities?: Record<string, unknown>;
  currency?: string;
  mortgage_available?: boolean;
  mortgage_rate?: number;
  mortgage_term?: number;
  latitude?: number;
  longitude?: number;
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
  images?: string[];
  amenities?: Record<string, unknown>;
  currency?: string;
  mortgage_available?: boolean;
  mortgage_rate?: number;
  mortgage_term?: number;
}

export const propertiesApi = {
  // Public — approved properties only
  getAll: (filters: PropertyFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== "") params.append(key, String(val));
    });
    const query = params.toString();
    return apiRequest<Property[]>(`/properties${query ? `?${query}` : ""}`);
  },

  // Dashboard — all properties including pending (agents & admins)
  getAllForDashboard: (token: string) =>
    apiRequest<Property[]>(`/properties?all=true`, { token }),

  create: (data: CreatePropertyPayload, token: string) =>
    apiRequest<Property>("/properties", { method: "POST", body: data, token }),

  update: (id: string, data: Partial<CreatePropertyPayload>, token: string) =>
    apiRequest<Property>(`/properties/${id}`, { method: "PUT", body: data, token }),

  toggleAvailability: (id: string, availability: "available" | "taken", token: string) =>
    apiRequest<Property>(`/properties/${id}/availability`, {
      method: "PUT",
      body: { availability },
      token,
    }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/properties/${id}`, {
      method: "DELETE",
      token,
    }),

  feature: (id: string, days: number, token: string) =>
    apiRequest<Property>(`/properties/${id}/feature`, {
      method: "PUT", body: { days }, token,
    }),

  unfeature: (id: string, token: string) =>
    apiRequest<Property>(`/properties/${id}/unfeature`, {
      method: "PUT", token,
    }),
  };