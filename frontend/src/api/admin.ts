import type { AdminAd, AdminOrganisation, Stats } from '../types/api'
import { api } from './client'

export const getStats = () => api<Stats>('/admin/stats')

export const listOrganisations = (status = 'pending') =>
  api<AdminOrganisation[]>(`/admin/organisations?status=${status}`)

export const approveOrganisation = (id: number) =>
  api<AdminOrganisation>(`/admin/organisations/${id}/approve`, { method: 'POST' })

export const rejectOrganisation = (id: number, note: string) =>
  api<AdminOrganisation>(`/admin/organisations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })

export const listAdminAds = (reported = false) =>
  api<AdminAd[]>(`/admin/ads${reported ? '?reported=true' : ''}`)

export const moderateAd = (id: number, status: 'approved' | 'hidden' | 'removed') =>
  api<AdminAd>(`/admin/ads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
