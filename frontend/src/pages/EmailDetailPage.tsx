import { Fragment, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getEmail, updateEmail } from '../api/emails'
import DeadlineBadge from '../components/DeadlineBadge'
import NavBar from '../components/NavBar'
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
            className="break-all text-blue-600 underline"
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
      <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
        <NavBar />
        <p className="py-10 text-center text-sm text-slate-500">{error}</p>
      </main>
    )
  }
  if (!email) return <p className="p-10 text-center text-sm text-slate-400">Loading…</p>

  const isNotice = email.segment === 'UM_NOTICE'
  const hasDetails =
    email.deadline || email.event_date || email.venue || email.organiser || email.registration_link

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <NavBar />
      <button type="button" onClick={() => navigate(-1)} className="mb-3 text-sm text-blue-600">
        ← Back
      </button>

      <article
        className={`rounded-2xl border bg-white p-4 ${
          isNotice ? 'border-amber-300' : 'border-slate-200'
        }`}
      >
        {isNotice && (
          <p className="mb-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Official UM notice
          </p>
        )}
        <h1 className="text-lg font-semibold text-slate-900">{email.subject}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {email.sender_name}
          {email.sender_email && (
            <span className="text-slate-400"> &lt;{email.sender_email}&gt;</span>
          )}
        </p>
        <p className="text-xs text-slate-400">{formatDateTime(email.received_at)}</p>

        {email.recommendation === 'for_you' && email.recommendation_reason && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            For you: {email.recommendation_reason}
          </p>
        )}

        {hasDetails && (
          <dl className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
            {email.deadline && (
              <div className="flex items-center gap-2">
                <dt className="font-medium text-slate-700">Deadline:</dt>
                <dd className="flex items-center gap-2 text-slate-600">
                  {formatDateTime(email.deadline)}
                  <DeadlineBadge deadline={email.deadline} now={now} />
                </dd>
              </div>
            )}
            {email.event_date && (
              <div>
                <dt className="inline font-medium text-slate-700">When: </dt>
                <dd className="inline text-slate-600">{formatDateTime(email.event_date)}</dd>
              </div>
            )}
            {email.venue && (
              <div>
                <dt className="inline font-medium text-slate-700">Where: </dt>
                <dd className="inline text-slate-600">{email.venue}</dd>
              </div>
            )}
            {email.organiser && (
              <div>
                <dt className="inline font-medium text-slate-700">Organiser: </dt>
                <dd className="inline text-slate-600">{email.organiser}</dd>
              </div>
            )}
            {email.registration_link && (
              <a
                href={email.registration_link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 block rounded-xl bg-blue-600 px-4 py-2 text-center font-semibold text-white"
              >
                Register / apply
              </a>
            )}
            <p className="pt-1 text-xs text-slate-400">Details found by AI. Please double-check.</p>
          </dl>
        )}

        <div className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-slate-800">
          <Linkified text={email.body_text || email.snippet} />
        </div>

        {email.web_link && (
          <a
            href={email.web_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-blue-600 underline"
          >
            {openOriginalLabel(email.web_link)} ↗
          </a>
        )}
      </article>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          Segment
          <select
            value={email.segment ?? ''}
            disabled={moving}
            onChange={(e) => move(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {!email.segment && <option value="">Sorting…</option>}
            {SEGMENT_ORDER.map((code) => (
              <option key={code} value={code}>
                {segmentLabel(code)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-slate-400">
          {email.segment_reason ? `Why: ${email.segment_reason}. ` : ''}
          If you move it, future emails from this sender will go there too.
        </p>
        <Link
          to={`/inbox?segment=${email.segment ?? ''}`}
          className="mt-2 inline-block text-sm text-blue-600"
        >
          See all in {segmentLabel(email.segment)}
        </Link>
      </section>
    </main>
  )
}
