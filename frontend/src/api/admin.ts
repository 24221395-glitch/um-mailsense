import type { Ad, Organisation, Stats } from "../types/api";
import { USE_MOCKS, mockDelay, request } from "./client";

export function getPendingOrganisations(): Promise<Organisation[]> {
  return USE_MOCKS ? mockDelay([]) : request("/admin/organisations?status=pending");
}

export function decideOrganisation(id: string, approve: boolean): Promise<Organisation> {
  return request(`/admin/organisations/${id}/${approve ? "approve" : "reject"}`, {
    method: "POST",
  });
}

export function getPendingAds(): Promise<Ad[]> {
  return USE_MOCKS ? mockDelay([]) : request("/admin/ads?status=pending");
}

export function approveAd(id: string): Promise<Ad> {
  return request(`/admin/ads/${id}/approve`, { method: "POST" });
}

export function removeAd(id: string): Promise<void> {
  return request(`/admin/ads/${id}`, { method: "DELETE" });
}

export function getStats(): Promise<Stats> {
  return USE_MOCKS
    ? mockDelay({ users: 0, emails_classified: 0, organisations: 0, ads: 0 })
    : request("/admin/stats");
}
