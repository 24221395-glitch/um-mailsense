import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAd, listAds, reportAd, saveAd, unsaveAd } from '../api/ads'
import { ApiError } from '../api/client'
import AdCard from '../components/AdCard'
import SegmentTabs from '../components/SegmentTabs'
import { AD_CATEGORIES, FACULTIES } from '../faculties'
import { segmentLabel } from '../segments'
import type { Ad } from '../types/api'

const FOR_YOU = 'FOR_YOU'
const SAVED = 'SAVED'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdDetail({
  ad,
  onClose,
  onToggleSave,
}: {
  ad: Ad
  onClose: () => void
  onToggleSave: (ad: Ad) => void
}) {
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState<string | null>(null)

  async function submitReport() {
    try {
      await reportAd(ad.id, reason)
      setNote('Thanks, an admin will review this post.')
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not send the report.')
    }
    setReporting(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.title}
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">{ad.title}</h2>
            <p className="text-sm text-muted">{ad.organisation_name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-faint">
            ✕
          </button>
        </div>
        {ad.image_url && (
          <img src={ad.image_url} alt="" className="mt-3 max-h-56 w-full rounded-xl object-cover" />
        )}
        {ad.recommendation === 'for_you' && ad.recommendation_reason && (
          <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
            For you: {ad.recommendation_reason}
          </p>
        )}
        <dl className="mt-3 space-y-1 text-sm">
          <div>
            <dt className="inline font-medium text-ink-2">Category: </dt>
            <dd className="inline text-muted">{segmentLabel(ad.category)}</dd>
          </div>
          {ad.event_date && (
            <div>
              <dt className="inline font-medium text-ink-2">When: </dt>
              <dd className="inline text-muted">{formatDate(ad.event_date)}</dd>
            </div>
          )}
          {ad.deadline && (
            <div>
              <dt className="inline font-medium text-ink-2">Register by: </dt>
              <dd className="inline text-danger">{formatDate(ad.deadline)}</dd>
            </div>
          )}
          {ad.venue && (
            <div>
              <dt className="inline font-medium text-ink-2">Where: </dt>
              <dd className="inline text-muted">{ad.venue}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-ink-2">For: </dt>
            <dd className="inline text-muted">{ad.faculty ?? 'All faculties'}</dd>
          </div>
        </dl>
        <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{ad.description}</p>

        <div className="mt-4 flex gap-2">
          {ad.link && (
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-on-accent"
            >
              Register / more info
            </a>
          )}
          <button
            type="button"
            onClick={() => onToggleSave(ad)}
            className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink-2"
          >
            {ad.is_saved ? '♥ Saved' : '♡ Save'}
          </button>
        </div>

        {note && <p className="mt-3 text-sm text-muted">{note}</p>}
        {reporting ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What is wrong with this post?"
              aria-label="Report reason"
              className="w-full rounded-xl border border-line p-2 text-sm"
            />
            <button
              type="button"
              disabled={reason.trim().length < 3}
              onClick={submitReport}
              className="rounded-xl bg-danger px-3 py-1.5 text-sm text-on-accent disabled:opacity-50"
            >
              Send report
            </button>
          </div>
        ) : (
          !note && (
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="mt-3 text-xs text-faint underline"
            >
              Report this post
            </button>
          )
        )}
      </div>
    </div>
  )
}

export default function AdBoardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('ALL')
  const [faculty, setFaculty] = useState('')
  const [q, setQ] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Ad | null>(null)
  const [refetched, setRefetched] = useState(false)

  const load = useCallback(async () => {
    try {
      const page = await listAds({
        category: AD_CATEGORIES.includes(tab) ? tab : undefined,
        forYou: tab === FOR_YOU,
        saved: tab === SAVED,
        faculty: faculty || undefined,
        q: q || undefined,
      })
      setAds(page.items)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [tab, faculty, q, navigate])

  useEffect(() => {
    const timer = window.setTimeout(load, q ? 300 : 0) // debounce typing
    return () => window.clearTimeout(timer)
  }, [load, q])

  // "For you" scores are computed in the background on first view: refresh once.
  const unscored = ads.some((a) => a.recommendation === null)
  useEffect(() => {
    if (!unscored || refetched) return
    const timer = window.setTimeout(() => {
      setRefetched(true)
      load()
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [unscored, refetched, load])

  async function toggleSave(ad: Ad) {
    const next = !ad.is_saved
    const update = (a: Ad) => (a.id === ad.id ? { ...a, is_saved: next } : a)
    setAds((list) => list.map(update))
    setOpen((o) => (o ? update(o) : o))
    try {
      await (next ? saveAd(ad.id) : unsaveAd(ad.id))
    } catch {
      load()
    }
  }

  async function openAd(id: number) {
    try {
      setOpen(await getAd(id))
    } catch {
      /* post removed meanwhile */
    }
  }

  const tabs = [
    { code: 'ALL', label: 'All' },
    { code: FOR_YOU, label: '★ For you' },
    { code: SAVED, label: '♥ Saved' },
    ...AD_CATEGORIES.map((c) => ({ code: c, label: segmentLabel(c) })),
  ]

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-bold text-ink">Community board</h1>
      <p className="mb-4 text-sm text-muted">Programmes from verified UM clubs and offices.</p>

      <div className="mb-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts"
          aria-label="Search posts"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        />
        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          aria-label="Faculty"
          className="w-36 rounded-xl border border-line bg-surface px-2 py-2 text-sm"
        >
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f} value={f}>
              {f.replace('Faculty of ', '')}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={tab} onChange={setTab} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-faint">Loading posts…</p>
      ) : ads.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">
          {tab === SAVED
            ? 'You have not saved any posts yet.'
            : tab === FOR_YOU
              ? 'No matches yet. Add your profile, or check back soon.'
              : 'No posts match.'}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <li key={ad.id}>
              <AdCard
                id={ad.id}
                title={ad.title}
                organisationName={ad.organisation_name}
                category={segmentLabel(ad.category)}
                imageUrl={ad.image_url}
                eventDate={ad.event_date}
                isSaved={ad.is_saved}
                recommendation={ad.recommendation}
                onToggleSave={() => toggleSave(ad)}
                onClick={openAd}
              />
            </li>
          ))}
        </ul>
      )}

      {open && <AdDetail ad={open} onClose={() => setOpen(null)} onToggleSave={toggleSave} />}
    </div>
  )
}
