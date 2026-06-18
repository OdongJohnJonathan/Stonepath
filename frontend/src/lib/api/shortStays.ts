import { apiRequest } from "./client";

export interface ShortStayBooking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  phone_number: string;
  provider: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid" | "refunded";
  property_title?: string;
  property_images?: string[];
  property_location?: string;
  currency?: string;
  host_first_name?: string;
  host_last_name?: string;
  host_email?: string;
  host_phone?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  created_at: string;
}

export interface BookShortStayPayload {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  phone_number: string;
  provider: string;
  message?: string;
}

export const shortStaysApi = {
  checkAvailability: (property_id: string, check_in: string, check_out: string) =>
    apiRequest<{ available: boolean }>(
      `/short-stays/available?property_id=${property_id}&check_in=${check_in}&check_out=${check_out}`
    ),

  getBlockedDates: (property_id: string) =>
    apiRequest<{ blocked: string[] }>(`/short-stays/blocked/${property_id}`),

  blockDates: (property_id: string, dates: string[], action: "block" | "unblock", token: string) =>
    apiRequest<{ message: string; count: number }>("/short-stays/block", {
      method: "POST",
      body: { property_id, dates, action },
      token,
    }),

  book: (data: BookShortStayPayload, token: string) =>
    apiRequest<{ booking: ShortStayBooking; nights: number; totalAmount: number }>(
      "/short-stays/book",
      { method: "POST", body: data, token }
    ),

  getMine: (token: string) =>
    apiRequest<ShortStayBooking[]>("/short-stays/mine", { token }),

  getHosted: (token: string) =>
    apiRequest<ShortStayBooking[]>("/short-stays/hosted", { token }),

  updateStatus: (id: string, status: "confirmed" | "cancelled" | "completed", token: string) =>
    apiRequest<ShortStayBooking>(`/short-stays/${id}/status`, {
      method: "PUT",
      body: { status },
      token,
    }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/short-stays/${id}`, {
      method: "DELETE",
      token,
    }),
};