import { apiRequest } from "./client";

export interface Enquiry {
  id: string;
  buyer_id: string;
  property_id: string;
  agent_id: string;
  message: string;
  status: "pending" | "responded" | "closed";
  property_title?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  created_at: string;
}

export interface SendEnquiryPayload {
  property_id: string;
  message: string;
}

export const enquiriesApi = {
  send: (data: SendEnquiryPayload, token: string) =>
    apiRequest<Enquiry>("/enquiries", { method: "POST", body: data, token }),

  getMyEnquiries: (token: string) =>
    apiRequest<Enquiry[]>("/enquiries", { token }),

  updateStatus: (id: string, status: "pending" | "responded" | "closed", token: string) =>
    apiRequest<Enquiry>(`/enquiries/${id}`, { method: "PUT", body: { status }, token }),
};