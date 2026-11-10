export type Email = {
  id: number
  sender_name: string
  subject: string
  snippet: string
  received_at: string
  is_read: boolean
  segment: string
  deadline: string | null
  recommendation: 'for_you' | 'not_for_you' | null
}