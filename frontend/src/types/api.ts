// Types matching the backend responses (backend/app/schemas). Keep in sync with the API.

export type Recommendation = 'for_you' | 'not_for_you' | null

export type Email = {
  id: number
  sender_name: string
  sender_email?: string
  subject: string
  snippet: string
  received_at: string
  is_read: boolean
  segment: string | null // null = not classified by the AI yet
  deadline: string | null
  recommendation: Recommendation
  recommendation_reason?: string | null
}

export type EmailDetail = Email & {
  body_text: string
  web_link: string | null
  venue: string | null
  organiser: string | null
  registration_link: string | null
  segment_confidence: number | null
  segment_is_manual: boolean
  recommendation_reason: string | null
}

export type EmailPage = {
  items: Email[]
  total: number
  page: number
  page_size: number
}

export type SegmentCount = {
  code: string | null
  total: number
  unread: number
}

export type Account = {
  id: number
  provider: 'microsoft' | 'google'
  email: string
  needs_reconnect: boolean
}

export type User = {
  id: number
  email: string
  name: string
  role: 'student' | 'organisation' | 'admin'
  accounts: Account[]
}

export type ProfileInput = {
  field_of_study: string | null
  year_of_study: number | null
  skills: string[]
  interests: string[]
}

export type Profile = ProfileInput & {
  summary: string
  source: 'cv' | 'manual'
  cv_filename: string | null
  updated_at: string
}

export type Providers = {
  microsoft: boolean
  google: boolean
}
