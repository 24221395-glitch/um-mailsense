import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getSegmentCounts } from '../api/emails'
import { SEGMENT_ORDER, UNSORTED, segmentLabel } from '../segments'
import type { SegmentCount } from '../types/api'

const ICONS: Record<string, string> = {
  UM_NOTICE: '🏛️',
  HACKATHON: '💻',
  RESEARCH: '🔬',
  EVENT: '🎤',
  SCHOLARSHIP_CAREER: '🎓',
  CLUB: '🤝',
  NOT_FOR_ME: '🗑️',
}

/** Overview of all segments with total and unread counts (FR-16). */
export default function SegmentPage() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState<SegmentCount[]>([])

  useEffect(() => {
    getSegmentCounts()
      .then(setCounts)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      })
  }, [navigate])

  const byCode = new Map(counts.map((c) => [c.code ?? UNSORTED, c]))
  const unsorted = byCode.get(UNSORTED)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-ink">Segments</h1>
      <ul className="grid grid-cols-2 gap-3">
        {SEGMENT_ORDER.map((code) => {
          const c = byCode.get(code)
          const official = code === 'UM_NOTICE'
          return (
            <li key={code}>
              <Link
                to={`/inbox?segment=${code}`}
                className={`block h-full rounded-2xl border bg-surface p-4 hover:border-line-strong ${
                  official ? 'border-line-strong' : 'border-line'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {ICONS[code]}
                </span>
                <p className="mt-2 font-semibold text-ink">{segmentLabel(code)}</p>
                <p className="text-sm text-muted">
                  {c?.total ?? 0} emails
                  {c && c.unread > 0 && (
                    <span className="ml-1 font-semibold text-accent">· {c.unread} new</span>
                  )}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
      {unsorted && unsorted.total > 0 && (
        <p className="mt-4 text-sm text-muted">{unsorted.total} emails are still being sorted…</p>
      )}
    </div>
  )
}
