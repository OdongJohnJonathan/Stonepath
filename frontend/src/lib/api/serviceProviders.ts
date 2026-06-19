import { apiRequest } from "./client";

export interface ServiceCategory {
  id: number;
  tier: string;
  name: string;
  slug?: string;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  phone_number: string;
  email?: string;
  whatsapp?: string;
  country: string;
  district?: string;
  location?: string;
  years_experience?: number;
  logo_url?: string;
  images?: string[];
  status: "pending" | "approved" | "rejected";
  is_verified: boolean;
  rating?: number;
  categories: ServiceCategory[];
  account_email?: string;
  created_at: string;
}

export interface UpdateProviderPayload {
  business_name?: string;
  description?: string;
  phone_number?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  district?: string;
  location?: string;
  years_experience?: number;
  images?: string[];
  logo_url?: string;
  category_ids?: number[];
}

export interface ProviderFilters {
  category_id?: number;
  district?: string;
  country?: string;
  q?: string;
}

export const serviceProvidersApi = {
  getCategories: () =>
    apiRequest<ServiceCategory[]>("/service-providers/categories"),

  getAll: (filters: ProviderFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== "") params.append(key, String(val));
    });
    const query = params.toString();
    return apiRequest<ServiceProvider[]>(`/service-providers${query ? `?${query}` : ""}`);
  },

  getOne: (id: string) =>
    apiRequest<ServiceProvider>(`/service-providers/${id}`),

  getMine: (token: string) =>
    apiRequest<ServiceProvider>("/service-providers/mine", { token }),

  updateMine: (data: UpdateProviderPayload, token: string) =>
    apiRequest<ServiceProvider>("/service-providers/mine", { method: "PUT", body: data, token }),

  // Admin
  getAllForAdmin: (token: string) =>
    apiRequest<ServiceProvider[]>("/service-providers/admin/all", { token }),

  approve: (id: string, token: string) =>
    apiRequest<ServiceProvider>(`/service-providers/${id}/approve`, { method: "PUT", token }),

  reject: (id: string, token: string) =>
    apiRequest<ServiceProvider>(`/service-providers/${id}/reject`, { method: "PUT", token }),

  toggleVerified: (id: string, token: string) =>
    apiRequest<ServiceProvider>(`/service-providers/${id}/verify`, { method: "PUT", token }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/service-providers/${id}`, { method: "DELETE", token }),
};