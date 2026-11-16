import { mockEmails } from '../mocks/emails'
import type { EmailDetail, EmailPage, SegmentCount } from '../types/api'
import { USE_MOCKS, api } from './client'

export type EmailQuery = {
  segment?: string
  q?: string
  forYou?: boolean
  page?: number
  pageSize?: number
}

export function listEmails(query: EmailQuery = {}): Promise<EmailPage> {
  if (USE_MOCKS) {
    const items = mockEmails.filter((e) => !query.segment || e.segment === query.segment)
    return Promise.resolve({ items, total: items.length, page: 1, page_size: items.length })
  }
  const params = new URLSearchParams()
  if (query.segment) params.set('segment', query.segment)
  if (query.q) params.set('q', query.q)
  if (query.forYou) params.set('for_you', 'true')
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('page_size', String(query.pageSize))
  const qs = params.toString()
  return api<EmailPage>(`/emails${qs ? `?${qs}` : ''}`)
}

export function getSegmentCounts(): Promise<SegmentCount[]> {
  if (USE_MOCKS) {
    const counts = new Map<string | null, SegmentCount>()
    for (const e of mockEmails) {
      const c = counts.get(e.segment) ?? { code: e.segment, total: 0, unread: 0 }
      c.total += 1
      if (!e.is_read) c.unread += 1
      counts.set(e.segment, c)
    }
    return Promise.resolve([...counts.values()])
  }
  return api<SegmentCount[]>('/emails/segment-counts')
}

export function getEmail(id: number): Promise<EmailDetail> {
  return api<EmailDetail>(`/emails/${id}`)
}

export function updateEmail(
  id: number,
  changes: { is_read?: boolean; segment?: string },
): Promise<EmailDetail> {
  return api<EmailDetail>(`/emails/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })
}

export function syncNow(): Promise<{ new_emails: number }> {
  if (USE_MOCKS) return Promise.resolve({ new_emails: 0 })
  return api<{ new_emails: number }>('/emails/sync', { method: 'POST' })
}
