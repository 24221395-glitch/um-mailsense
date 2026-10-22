import type { Ad, AdIn, Organisation, Page, Segment } from "../types/api";
import { USE_MOCKS, mockDelay, query, request } from "./client";
import { mockAds } from "../mocks/ads";

export function getAds(opts: { category?: Segment; q?: string } = {}): Promise<Page<Ad>> {
  if (USE_MOCKS) {
    const q = (opts.q ?? "").toLowerCase();
    const items = mockAds.filter(
      (a) =>
        (!opts.category || a.category === opts.category) &&
        (!q || `${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase().includes(q)),
    );
    return mockDelay({ items, total: items.length, page: 1, page_size: 20 });
  }
  return request(`/ads${query({ category: opts.category, q: opts.q })}`);
}

export function createAd(body: AdIn): Promise<Ad> {
  return request("/ads", { method: "POST", body: JSON.stringify(body) });
}

export function setSaved(id: string, saved: boolean): Promise<void> {
  if (USE_MOCKS) {
    const a = mockAds.find((m) => m.id === id);
    if (a) a.saved = saved;
    return mockDelay(undefined);
  }
  return request(`/ads/${id}/save`, { method: saved ? "POST" : "DELETE" });
}

export function registerOrganisation(body: {
  name: string;
  contact_email: string;
  description?: string;
}): Promise<Organisation> {
  return request("/organisations", { method: "POST", body: JSON.stringify(body) });
}
