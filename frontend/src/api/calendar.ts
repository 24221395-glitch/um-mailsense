import type { CalendarItem, NotificationSettings } from '../types/api'
import { api } from './client'

export function getDeadlines(from?: Date, to?: Date): Promise<CalendarItem[]> {
  const params = new URLSearchParams()
  if (from) params.set('date_from', from.toISOString())
  if (to) params.set('date_to', to.toISOString())
  const qs = params.toString()
  return api<CalendarItem[]>(`/deadlines${qs ? `?${qs}` : ''}`)
}

export const getNotificationSettings = () => api<NotificationSettings>('/notification-settings')

export const saveNotificationSettings = (s: NotificationSettings) =>
  api<NotificationSettings>('/notification-settings', { method: 'PUT', body: JSON.stringify(s) })
