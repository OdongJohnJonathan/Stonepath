import { apiRequest } from "./client";

export interface Enquiry {
  id: string;
  buyer_id: string;
  property_id: string;
  agent_id: string;
  message: string;
  reply?: string;
  status: "pending" | "responded" | "closed";
  property_title?: string;
  property_images?: string[];
  property_location?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface SendEnquiryPayload {
  property_id: string;
  message: string;
}

export const enquiriesApi = {
  // Buyer sends enquiry
  send: (data: SendEnquiryPayload, token: string) =>
    apiRequest<Enquiry>("/enquiries", { method: "POST", body: data, token }),

  // Buyer sees their sent enquiries
  getMine: (token: string) =>
    apiRequest<Enquiry[]>("/enquiries/mine", { token }),

  // Agent sees enquiries for their listings
  getForAgent: (token: string) =>
    apiRequest<Enquiry[]>("/enquiries", { token }),

  // Agent replies
  reply: (id: string, reply: string, token: string) =>
    apiRequest<Enquiry>(`/enquiries/${id}/reply`, {
      method: "PUT", body: { reply }, token,
    }),

  // Agent updates status
  updateStatus: (id: string, status: "pending" | "responded" | "closed", token: string) =>
    apiRequest<Enquiry>(`/enquiries/${id}/status`, {
      method: "PUT", body: { status }, token,
    }),
};