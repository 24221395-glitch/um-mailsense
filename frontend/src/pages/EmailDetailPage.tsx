import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getEmail, updateEmail } from '../api/emails'
import DeadlineBadge from '../components/DeadlineBadge'
import { SEGMENT_ORDER, segmentLabel } from '../segments'
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
            className="break-all text-accent underline"
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

function openOriginalLabel(link: string): string {
  return link.includes('mail.google.com') ? 'Open in Gmail' : 'Open in Outlook'
}

export default function EmailDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)
  const [now] = useState(() => new Date())

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
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="py-10 text-center text-sm text-muted">{error}</p>
      </div>
    )
  }
  if (!email) return <p className="p-10 text-center text-sm text-faint">Loading…</p>

  const isNotice = email.segment === 'UM_NOTICE'
  const hasDetails =
    email.deadline || email.event_date || email.venue || email.organiser || email.registration_link

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="mb-3 text-sm text-accent">
        ← Back
      </button>

      <article
        className={`rounded-2xl border bg-surface p-4 ${
          isNotice ? 'border-line-strong' : 'border-line'
        }`}
      >
        {isNotice && (
          <p className="mb-2 inline-block rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
            Official UM notice
          </p>
        )}
        <h1 className="text-lg font-semibold text-ink">{email.subject}</h1>
        <p className="mt-1 text-sm text-muted">
          {email.sender_name}
          {email.sender_email && <span className="text-faint"> &lt;{email.sender_email}&gt;</span>}
        </p>
        <p className="text-xs text-faint">{formatDateTime(email.received_at)}</p>

        {email.recommendation === 'for_you' && email.recommendation_reason && (
          <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
            For you: {email.recommendation_reason}
          </p>
        )}

        {hasDetails && (
          <dl className="mt-3 space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm">
            {email.deadline && (
              <div className="flex items-center gap-2">
                <dt className="font-medium text-ink-2">Deadline:</dt>
                <dd className="flex items-center gap-2 text-muted">
                  {formatDateTime(email.deadline)}
                  <DeadlineBadge deadline={email.deadline} now={now} />
                </dd>
              </div>
            )}
            {email.event_date && (
              <div>
                <dt className="inline font-medium text-ink-2">When: </dt>
                <dd className="inline text-muted">{formatDateTime(email.event_date)}</dd>
              </div>
            )}
            {email.venue && (
              <div>
                <dt className="inline font-medium text-ink-2">Where: </dt>
                <dd className="inline text-muted">{email.venue}</dd>
              </div>
            )}
            {email.organiser && (
              <div>
                <dt className="inline font-medium text-ink-2">Organiser: </dt>
                <dd className="inline text-muted">{email.organiser}</dd>
              </div>
            )}
            {email.registration_link && (
              <a
                href={email.registration_link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 block rounded-xl bg-accent px-4 py-2 text-center font-semibold text-on-accent"
              >
                Register / apply
              </a>
            )}
            <p className="pt-1 text-xs text-faint">Details found by AI. Please double-check.</p>
          </dl>
        )}

        <div className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-ink">
          <Linkified text={email.body_text || email.snippet} />
        </div>

        {email.web_link && (
          <a
            href={email.web_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-accent underline"
          >
            {openOriginalLabel(email.web_link)} ↗
          </a>
        )}
      </article>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <label className="block text-sm font-medium text-ink-2">
          Segment
          <select
            value={email.segment ?? ''}
            disabled={moving}
            onChange={(e) => move(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          >
            {!email.segment && <option value="">Sorting…</option>}
            {SEGMENT_ORDER.map((code) => (
              <option key={code} value={code}>
                {segmentLabel(code)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-faint">
          {email.segment_reason ? `Why: ${email.segment_reason}. ` : ''}
          If you move it, future emails from this sender will go there too.
        </p>
        <Link
          to={`/inbox?segment=${email.segment ?? ''}`}
          className="mt-2 inline-block text-sm text-accent"
        >
          See all in {segmentLabel(email.segment)}
        </Link>
      </section>
    </div>
  )
}
