import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getEmail, updateEmail } from '../api/emails'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ExternalIcon,
  SparkleIcon,
} from '../components/icons'
import { SEGMENT_ORDER, segmentColor, segmentLabel } from '../segments'
import type { EmailDetail } from '../types/api'

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g

/** Plain text with web links made clickable. Nothing is rendered as HTML. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="break-all font-medium text-accent underline"
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '@'
  )
}

/** Build a calendar file (.ics) so the deadline/event can go into any calendar app. */
function downloadIcs(email: EmailDetail) {
  const when = email.deadline ?? email.event_date
  if (!when) return
  const start = new Date(when)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const title = `${email.deadline ? 'Deadline: ' : ''}${email.subject}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UM MailSense//EN',
    'BEGIN:VEVENT',
    `UID:mailsense-${email.id}-${fmt(start)}@um-mailsense`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(`From ${email.sender_name}. ${email.registration_link ?? ''}`)}`,
    ...(email.venue ? [`LOCATION:${esc(email.venue)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mailsense-event.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function EmailDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    const emailId = Number(id)
    getEmail(emailId)
      .then((e) => {
        setEmail(e)
        if (!e.is_read) updateEmail(emailId, { is_read: true }).catch(() => {})
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
        else setError('This email could not be found.')
      })
  }, [id, navigate])

  async function move(segment: string) {
    if (!email || segment === email.segment) return
    setMoving(true)
    try {
      setEmail(await updateEmail(email.id, { segment }))
    } finally {
      setMoving(false)
    }
  }

  if (error) {
    return <p className="card mx-auto max-w-3xl py-10 text-center text-sm text-muted">{error}</p>
  }
  if (!email) return <p className="p-10 text-center text-sm text-faint">Loading…</p>

  const { fg, bg } = segmentColor(email.segment)
  const summary = [
    email.segment_reason && `${segmentLabel(email.segment)}: ${email.segment_reason}.`,
    email.deadline && `Deadline: ${formatDateTime(email.deadline)}.`,
    email.event_date && `When: ${formatDateTime(email.event_date)}.`,
    email.venue && `Where: ${email.venue}.`,
    email.organiser && `Organised by ${email.organiser}.`,
    email.recommendation === 'for_you' &&
      email.recommendation_reason &&
      `For you: ${email.recommendation_reason}.`,
  ].filter(Boolean) as string[]
  const openLink = email.registration_link ?? email.web_link
  const hasDate = Boolean(email.deadline || email.event_date)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        to="/inbox"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-accent"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to Inbox
      </Link>

      <article className="card p-6">
        <h1 className="text-2xl font-bold leading-snug text-ink">{email.subject}</h1>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${fg}, #5b3ff8)` }}
          >
            {initials(email.sender_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {email.sender_name}{' '}
              {email.sender_email && (
                <span className="font-normal text-muted">&lt;{email.sender_email}&gt;</span>
              )}
            </p>
            <p className="text-xs text-faint">{formatDateTime(email.received_at)}</p>
          </div>
        </div>

        {/* AI summary */}
        <section className="mt-5 rounded-2xl bg-accent-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <SparkleIcon className="h-5 w-5 text-accent" /> AI Summary
            </h2>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: bg, color: fg }}
            >
              {segmentLabel(email.segment)}
            </span>
          </div>
          {summary.length ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-2 marker:text-accent">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">The AI is still reading this email.</p>
          )}
          <p className="mt-3 text-xs text-faint">
            Found by AI. Please double-check important details.
          </p>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => downloadIcs(email)}
            disabled={!hasDate}
            className="btn-ghost"
            title={hasDate ? 'Download a calendar file' : 'No date found in this email'}
          >
            <CalendarIcon className="h-5 w-5" /> Add to Calendar
          </button>
          {openLink ? (
            <a
              href={openLink}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn-primary"
            >
              {email.registration_link ? 'View Opportunity' : 'Open in Gmail'}
              {email.registration_link ? (
                <ArrowRightIcon className="h-5 w-5" />
              ) : (
                <ExternalIcon className="h-5 w-5" />
              )}
            </a>
          ) : (
            <button type="button" disabled className="btn-primary">
              View Opportunity <ArrowRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </article>

      <article className="card p-6">
        <h2 className="mb-3 font-semibold text-ink">Email</h2>
        <div className="whitespace-pre-line break-words text-sm leading-relaxed text-ink-2">
          <Linkified text={email.body_text || email.snippet} />
        </div>
      </article>

      <section className="card p-6">
        <label className="block text-sm font-semibold text-ink">
          Segment
          <select
            value={email.segment ?? ''}
            disabled={moving}
            onChange={(e) => move(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
          >
            {!email.segment && <option value="">Sorting…</option>}
            {SEGMENT_ORDER.map((code) => (
              <option key={code} value={code}>
                {segmentLabel(code)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-muted">
          Wrong segment? Move it, and future emails from this sender will follow.
        </p>
      </section>
    </div>
  )
}
