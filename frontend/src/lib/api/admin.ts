import { apiRequest } from "./client";

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export const adminApi = {
  getUsers: (token: string) =>
    apiRequest<AdminUser[]>("/admin/users", { token }),

  changeRole: (id: string, role: number, token: string) =>
    apiRequest<AdminUser>(`/admin/users/${id}/role`, {
      method: "PUT", body: { role }, token,
    }),

  toggleActive: (id: string, token: string) =>
    apiRequest<AdminUser>(`/admin/users/${id}/deactivate`, {
      method: "PUT", token,
    }),

  verifyUser: (id: string, token: string) =>
    apiRequest<AdminUser>(`/admin/users/${id}/verify`, {
      method: "PUT", token,
    }),
};