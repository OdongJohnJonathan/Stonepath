import { apiRequest } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  role?: number;
  // Service Provider specific (only sent when role === 5)
  business_name?: string;
  business_description?: string;
  category_ids?: number[];
  country?: string;
  district?: string;
  location?: string;
  whatsapp?: string;
  years_experience?: number;
}

export interface AuthResponse {
  token: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: data }),

  register: (data: RegisterPayload) =>
    apiRequest<AuthResponse>("/auth/register", { method: "POST", body: data }),
};