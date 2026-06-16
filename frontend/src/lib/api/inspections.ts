import { apiRequest } from "./client";

export interface Inspection {
  id: string;
  property_id: string;
  buyer_id: string;
  agent_id: string;
  preferred_date: string;
  preferred_time: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_status: "pending" | "paid";
  amount: number;
  property_title?: string;
  property_images?: string[];
  property_location?: string;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  created_at: string;
}

export interface BookInspectionPayload {
  property_id: string;
  preferred_date: string;
  preferred_time: string;
  message?: string;
  phone_number: string;
  provider: string;
}

export const inspectionsApi = {
  book: (data: BookInspectionPayload, token: string) =>
    apiRequest<Inspection>("/inspections", { method: "POST", body: data, token }),

  getMine: (token: string) =>
    apiRequest<Inspection[]>("/inspections/mine", { token }),

  getForAgent: (token: string) =>
    apiRequest<Inspection[]>("/inspections", { token }),

  updateStatus: (id: string, status: string, token: string) =>
    apiRequest<Inspection>(`/inspections/${id}/status`, {
      method: "PUT", body: { status }, token,
    }),
};
