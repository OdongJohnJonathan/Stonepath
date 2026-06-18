export { authApi } from "./auth";
export { propertiesApi } from "./properties";
export { usersApi } from "./users";
export { savedApi } from "./saved";
export { enquiriesApi } from "./enquiries";
export { adminApi } from "./admin";
export { apiRequest } from "./client";

export { inspectionsApi } from "./inspections";
export type { Inspection, BookInspectionPayload } from "./inspections";

export type { Property, PropertyFilters, CreatePropertyPayload } from "./properties";
export type { UserProfile, UpdateProfilePayload } from "./users";
export type { Enquiry, SendEnquiryPayload } from "./enquiries";
export type { AdminUser } from "./admin";
export type { LoginPayload, RegisterPayload, AuthResponse } from "./auth";

export { shortStaysApi } from "./shortStays";
export type { ShortStayBooking, BookShortStayPayload } from "./shortStays";