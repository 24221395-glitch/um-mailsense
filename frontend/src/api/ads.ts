import type { Ad, AdInput, AdPage, MyAd } from '../types/api'
import { api } from './client'

export type AdQuery = {
  category?: string
  faculty?: string
  q?: string
  saved?: boolean
  forYou?: boolean
  page?: number
}

export function listAds(query: AdQuery = {}): Promise<AdPage> {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  if (query.faculty) params.set('faculty', query.faculty)
  if (query.q) params.set('q', query.q)
  if (query.saved) params.set('saved', 'true')
  if (query.forYou) params.set('for_you', 'true')
  if (query.page) params.set('page', String(query.page))
  const qs = params.toString()
  return api<AdPage>(`/ads${qs ? `?${qs}` : ''}`)
}

export const getAd = (id: number) => api<Ad>(`/ads/${id}`)
export const saveAd = (id: number) => api<void>(`/ads/${id}/save`, { method: 'POST' })
export const unsaveAd = (id: number) => api<void>(`/ads/${id}/save`, { method: 'DELETE' })

export const reportAd = (id: number, reason: string) =>
  api<{ status: string }>(`/ads/${id}/reports`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

/** Compute "for you" scores for these posts now. */
export const scoreAds = (adIds: number[]) =>
  api<{ scored: number }>('/ads/score', {
    method: 'POST',
    body: JSON.stringify({ ad_ids: adIds.slice(0, 30) }),
  })

export const myAds = () => api<MyAd[]>('/ads/mine')

export const createAd = (input: AdInput) =>
  api<MyAd>('/ads', { method: 'POST', body: JSON.stringify(input) })

export const updateAd = (id: number, input: AdInput) =>
  api<MyAd>(`/ads/${id}`, { method: 'PUT', body: JSON.stringify(input) })

export const deleteAd = (id: number) => api<void>(`/ads/${id}`, { method: 'DELETE' })
