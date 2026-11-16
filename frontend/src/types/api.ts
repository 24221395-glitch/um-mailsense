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
  segment_reason: string | null
  event_date: string | null
  recommendation_reason: string | null
}

export type EmailPage = {
  items: Email[]
  total: number
  page: number
  page_size: number
}

export type ProcessResult = {
  processed: number
  unsorted: number
  unscored: number
  ai_ready: boolean
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
  demo?: boolean // local demo sign-in (DEMO_MODE=true on the server)
}

export type Organisation = {
  id: number
  name: string
  description: string
  contact_email: string
  website: string | null
  faculty: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  applied_at: string
}

export type OrganisationInput = {
  name: string
  description: string
  contact_email: string
  website: string | null
  faculty: string | null
}

export type Ad = {
  id: number
  title: string
  description: string
  category: string
  event_date: string | null
  deadline: string | null
  venue: string | null
  link: string | null
  image_url: string | null
  faculty: string | null
  target_fields: string[]
  organisation_id: number
  organisation_name: string
  created_at: string
  is_saved: boolean
  recommendation: Recommendation
  recommendation_reason: string | null
}

export type AdInput = {
  title: string
  description: string
  category: string
  event_date: string | null
  deadline: string | null
  venue: string | null
  link: string | null
  image_url: string | null
  faculty: string | null
  target_fields: string[]
}

export type MyAd = Ad & {
  status: 'pending' | 'approved' | 'hidden' | 'removed'
  views: number
  saves: number
  open_reports: number
}

export type AdminAd = MyAd & { report_reasons: string[] }

export type AdminOrganisation = Organisation & { owner_email: string }

export type AdPage = { items: Ad[]; total: number; page: number; page_size: number }

export type Stats = {
  users: number
  active_users_7d: number
  emails: number
  emails_classified: number
  organisations_pending: number
  organisations_approved: number
  ads_live: number
  reports_open: number
  llm: {
    configured: boolean
    model?: string
    day?: string
    requests?: number
    prompt_tokens?: number
    completion_tokens?: number
  }
}

export type CalendarItem = {
  kind: 'email' | 'ad'
  id: number
  title: string
  source: string
  segment: string | null
  date: string
  date_type: 'deadline' | 'event'
  link: string | null
}

export type NotificationSettings = {
  enabled: boolean
  muted_segments: string[]
}
