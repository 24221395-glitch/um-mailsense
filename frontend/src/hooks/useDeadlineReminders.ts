import { useEffect } from 'react'
import { getDeadlines, getNotificationSettings } from '../api/calendar'

const CHECK_EVERY_MS = 30 * 60 * 1000
const SENT_KEY = 'mailsense.remindersSent'
const DAY = 24 * 3600 * 1000

function readSent(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeSent(sent: Record<string, number>) {
  try {
    // forget reminders older than 30 days so storage stays small
    const cutoff = Date.now() - 30 * DAY
    const kept = Object.fromEntries(Object.entries(sent).filter(([, t]) => t > cutoff))
    localStorage.setItem(SENT_KEY, JSON.stringify(kept))
  } catch {
    /* storage blocked: reminders may repeat, which is acceptable */
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

async function checkOnce() {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const settings = await getNotificationSettings()
  if (!settings.enabled) return
  const now = Date.now()
  const items = await getDeadlines(new Date(now), new Date(now + 3 * DAY))
  const sent = readSent()

  for (const item of items) {
    if (item.date_type !== 'deadline') continue
    if (item.segment && settings.muted_segments.includes(item.segment)) continue
    const left = new Date(item.date).getTime() - now
    if (left < 0) continue
    // one reminder at 3 days and one at 1 day before (FR-35)
    const stage = left <= DAY ? '1d' : '3d'
    const key = `${item.kind}:${item.id}:${item.date}:${stage}`
    if (sent[key]) continue
    const when = new Date(item.date).toLocaleString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    const n = new Notification(stage === '1d' ? 'Deadline tomorrow' : 'Deadline in 3 days', {
      body: `${item.title}\n${item.source} · due ${when}`,
      tag: key,
    })
    n.onclick = () => {
      window.focus()
      window.location.href = item.kind === 'email' ? `/emails/${item.id}` : '/calendar'
    }
    sent[key] = now
  }
  writeSent(sent)
}

/** Shows browser reminders for upcoming deadlines while MailSense is open. */
export function useDeadlineReminders() {
  useEffect(() => {
    const run = () => checkOnce().catch(() => {})
    run()
    const timer = window.setInterval(run, CHECK_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [])
}
