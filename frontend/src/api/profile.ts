import type { Profile, ProfileInput } from '../types/api'
import { API_BASE, ApiError, USE_MOCKS, api } from './client'

let mockProfile: Profile | null = null

export function getProfile(): Promise<Profile | null> {
  if (USE_MOCKS) return Promise.resolve(mockProfile)
  return api<Profile | null>('/profile')
}

export function saveProfile(input: ProfileInput): Promise<Profile> {
  if (USE_MOCKS) {
    mockProfile = {
      ...input,
      summary: '',
      source: 'manual',
      cv_filename: null,
      updated_at: new Date().toISOString(),
    }
    return Promise.resolve(mockProfile)
  }
  return api<Profile>('/profile', { method: 'PUT', body: JSON.stringify(input) })
}

export async function uploadCv(file: File): Promise<Profile> {
  const form = new FormData()
  form.append('file', file)
  // No JSON Content-Type here: the browser sets the multipart boundary itself.
  const res = await fetch(`${API_BASE}/profile/cv`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  if (!res.ok) {
    let message = 'Upload failed. Please try again.'
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, message)
  }
  return res.json()
}

export function deleteProfile(): Promise<void> {
  if (USE_MOCKS) {
    mockProfile = null
    return Promise.resolve()
  }
  return api<void>('/profile', { method: 'DELETE' })
}
