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