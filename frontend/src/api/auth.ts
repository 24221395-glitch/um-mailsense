import type { Providers, User } from '../types/api'
import { API_BASE, USE_MOCKS, api } from './client'

const MOCK_USER: User = {
  id: 1,
  email: 'student@siswa.um.edu.my',
  name: 'Demo Student',
  role: 'student',
  accounts: [
    { id: 1, provider: 'microsoft', email: 'student@siswa.um.edu.my', needs_reconnect: false },
  ],
}

export type Provider = 'microsoft' | 'google'

/** Full-page redirect to Microsoft or Google sign-in. Also used to add a second mailbox. */
export function signIn(provider: Provider) {
  if (USE_MOCKS) {
    window.location.href = '/inbox'
    return
  }
  window.location.href = `${API_BASE}/auth/${provider}/login`
}

export function getProviders(): Promise<Providers> {
  if (USE_MOCKS) return Promise.resolve({ microsoft: true, google: true })
  return api<Providers>('/auth/providers')
}

export function getMe(): Promise<User> {
  if (USE_MOCKS) return Promise.resolve(MOCK_USER)
  return api<User>('/auth/me')
}

export function signOut(): Promise<void> {
  if (USE_MOCKS) return Promise.resolve()
  return api<void>('/auth/logout', { method: 'POST' })
}

export function disconnectMailbox(accountId: number): Promise<void> {
  return api<void>(`/auth/accounts/${accountId}`, { method: 'DELETE' })
}

export function deleteAccount(): Promise<void> {
  return api<void>('/auth/me', { method: 'DELETE' })
}
