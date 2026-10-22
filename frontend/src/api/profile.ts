import type { Deadline, ItemType, Profile, Recommendation } from "../types/api";
import { USE_MOCKS, mockDelay, query, request } from "./client";
import { mockDeadlines, mockProfile } from "../mocks/user";

export function getProfile(): Promise<Profile> {
  return USE_MOCKS ? mockDelay(mockProfile) : request("/me/profile");
}

export function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  if (USE_MOCKS) return mockDelay(Object.assign(mockProfile, patch));
  return request("/me/profile", { method: "PATCH", body: JSON.stringify(patch) });
}

export function uploadCv(file: File): Promise<Profile> {
  if (USE_MOCKS) return mockDelay(Object.assign(mockProfile, { has_cv: true }), 800);
  const form = new FormData();
  form.append("file", file);
  return request("/me/cv", { method: "POST", body: form });
}

export function getRecommendations(itemType?: ItemType): Promise<Recommendation[]> {
  return USE_MOCKS
    ? mockDelay([])
    : request(`/me/recommendations${query({ item_type: itemType })}`);
}

export function getDeadlines(): Promise<Deadline[]> {
  return USE_MOCKS ? mockDelay(mockDeadlines) : request("/me/deadlines");
}
