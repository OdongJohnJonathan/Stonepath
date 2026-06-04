import { apiRequest } from "./client";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: number;
  is_verified: boolean;
  profile_image_url?: string;
  created_at: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image_url?: string;
}

export const usersApi = {
  getMe: (token: string) =>
    apiRequest<UserProfile>("/users/me", { token }),

  updateMe: (data: UpdateProfilePayload, token: string) =>
    apiRequest<UserProfile>("/users/me", { method: "PUT", body: data, token }),
};