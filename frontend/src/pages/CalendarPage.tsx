import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeadlines, getNotificationSettings, saveNotificationSettings } from '../api/calendar'
import { ApiError } from '../api/client'
import DeadlineCalendar from '../components/DeadlineCalendar'
import NavBar from '../components/NavBar'
import { notificationsSupported } from '../hooks/useDeadlineReminders'
import { SEGMENT_ORDER, segmentLabel } from '../segments'
import type { CalendarItem, NotificationSettings } from '../types/api'

function permission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [now] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [perm, setPerm] = useState(permission)

  useEffect(() => {
    // load the visible month plus the next 60 days for "Coming up"
    const from = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    const soon = new Date(now.getTime() + 60 * 24 * 3600 * 1000)
    const start = from < now ? from : new Date(now.getTime() - 24 * 3600 * 1000)
    getDeadlines(start, monthEnd > soon ? monthEnd : soon)
      .then(setItems)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      })
  }, [month, now, navigate])

  useEffect(() => {
    getNotificationSettings()
      .then(setSettings)
      .catch(() => {})
  }, [])

  async function update(next: NotificationSettings) {
    setSettings(next)
    try {
      setSettings(await saveNotificationSettings(next))
    } catch {
      /* keep local state; it will reload next visit */
    }
  }

  async function enableBrowserReminders() {
    if (!notificationsSupported()) return
    setPerm(await Notification.requestPermission())
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <NavBar />
      <h1 className="text-2xl font-bold text-slate-900">Deadlines</h1>
      <p className="mb-4 text-sm text-slate-500">From your emails and the posts you saved.</p>

      <DeadlineCalendar items={items} month={month} onMonthChange={setMonth} now={now} />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Reminders</h2>
        <p className="mt-1 text-sm text-slate-500">
          A reminder 3 days and 1 day before each deadline, while MailSense is open in your browser.
        </p>

        {perm === 'unsupported' && (
          <p className="mt-3 text-sm text-amber-700">
            This browser does not support notifications.
          </p>
        )}
        {perm === 'denied' && (
          <p className="mt-3 text-sm text-amber-700">
            Notifications are blocked. Allow them for this site in your browser settings.
          </p>
        )}
        {perm === 'default' && (
          <button
            type="button"
            onClick={enableBrowserReminders}
            className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
          >
            Turn on browser reminders
          </button>
        )}

        {settings && (
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between text-sm text-slate-700">
              Reminders on
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => update({ ...settings, enabled: e.target.checked })}
              />
            </label>
            <fieldset disabled={!settings.enabled} className="space-y-2 disabled:opacity-50">
              <legend className="mb-1 text-sm font-medium text-slate-700">Remind me about</legend>
              {SEGMENT_ORDER.filter((s) => s !== 'NOT_FOR_ME').map((code) => {
                const on = !settings.muted_segments.includes(code)
                return (
                  <label
                    key={code}
                    className="flex items-center justify-between text-sm text-slate-600"
                  >
                    {segmentLabel(code)}
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        update({
                          ...settings,
                          muted_segments: on
                            ? [...settings.muted_segments, code]
                            : settings.muted_segments.filter((s) => s !== code),
                        })
                      }
                    />
                  </label>
                )
              })}
            </fieldset>
          </div>
        )}
      </section>
    </main>
  )
}
