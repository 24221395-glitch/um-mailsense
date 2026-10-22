import type { User } from "../types/api";
import { API_BASE, USE_MOCKS, mockDelay, request } from "./client";
import { mockUser } from "../mocks/user";

export const loginUrl = `${API_BASE}/auth/login`;

export function getMe(): Promise<User> {
  return USE_MOCKS ? mockDelay(mockUser) : request<User>("/me");
}

export function logout(): Promise<void> {
  return USE_MOCKS ? mockDelay(undefined) : request<void>("/auth/logout", { method: "POST" });
}
