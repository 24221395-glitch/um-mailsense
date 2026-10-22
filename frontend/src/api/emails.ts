import type { Email, Page, Segment, SegmentCount } from "../types/api";
import { USE_MOCKS, mockDelay, query, request } from "./client";
import { mockEmails, mockSegmentCounts } from "../mocks/emails";

export function getSegments(): Promise<SegmentCount[]> {
  return USE_MOCKS ? mockDelay(mockSegmentCounts()) : request("/segments");
}

export function getEmails(
  opts: { segment?: Segment; unreadOnly?: boolean; page?: number } = {},
): Promise<Page<Email>> {
  if (USE_MOCKS) {
    const items = mockEmails.filter(
      (e) => (!opts.segment || e.segment === opts.segment) && (!opts.unreadOnly || !e.is_read),
    );
    return mockDelay({ items, total: items.length, page: 1, page_size: 20 });
  }
  return request(
    `/emails${query({ segment: opts.segment, unread_only: opts.unreadOnly, page: opts.page })}`,
  );
}

export function updateEmail(
  id: string,
  patch: { segment?: Segment; is_read?: boolean },
): Promise<Email> {
  if (USE_MOCKS) {
    const e = mockEmails.find((m) => m.id === id)!;
    Object.assign(e, patch, patch.segment ? { segment_source: "user" } : {});
    return mockDelay(e);
  }
  return request(`/emails/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}
