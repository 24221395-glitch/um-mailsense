import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAd, listAds, reportAd, saveAd, scoreAds, unsaveAd } from '../api/ads'
import { ApiError } from '../api/client'
import {
  BookmarkIcon,
  FilterIcon,
  SEGMENT_ICONS,
  SearchIcon,
  TrophyIcon,
} from '../components/icons'
import SegmentTabs from '../components/SegmentTabs'
import { AD_CATEGORIES, FACULTIES } from '../faculties'
import { segmentColor, segmentLabel } from '../segments'
import type { Ad } from '../types/api'

const FOR_YOU = 'FOR_YOU'
const SAVED = 'SAVED'

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

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
      className="fixed inset-0 z-30 flex items-end justify-center bg-[#17123a]/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl"
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
              className="btn-primary flex-1"
            >
              Register / more info
            </a>
          )}
          <button
            type="button"
            onClick={() => onToggleSave(ad)}
            className="btn-ghost py-2.5 text-sm"
          >
            <BookmarkIcon className="h-4 w-4" filled={ad.is_saved} />
            {ad.is_saved ? 'Saved' : 'Save'}
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
              className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
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
  const [showFilters, setShowFilters] = useState(false)
  const [q, setQ] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Ad | null>(null)

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

  // Posts without a "for you" score yet: ask the server to score them, then refresh once.
  const unscoredIds = ads.filter((a) => a.recommendation === null).map((a) => a.id)
  const unscoredKey = unscoredIds.join(',')
  useEffect(() => {
    if (!unscoredKey) return
    scoreAds(unscoredKey.split(',').map(Number))
      .then(({ scored }) => (scored > 0 ? load() : undefined))
      .catch(() => {})
  }, [unscoredKey, load])

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
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Opportunity Board</h1>
      <p className="mb-5 mt-1 text-muted">
        Discover programmes, competitions and events from UM clubs and organisations.
      </p>

      <div className="mb-3 flex gap-3">
        <label className="card flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
          <SearchIcon className="h-5 w-5 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search opportunities..."
            aria-label="Search opportunities"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none focus-visible:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={`card flex items-center gap-2 px-4 py-2.5 text-sm font-semibold ${
            showFilters || faculty
              ? 'text-accent ring-2 ring-accent'
              : 'text-ink-2 hover:text-accent'
          }`}
        >
          <FilterIcon className="h-4 w-4" /> Filters
        </button>
      </div>
      {showFilters && (
        <div className="card mb-3 flex flex-wrap items-center gap-3 p-3">
          <label htmlFor="faculty" className="text-sm font-medium text-ink-2">
            Faculty
          </label>
          <select
            id="faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
          >
            <option value="">All faculties</option>
            {FACULTIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {faculty && (
            <button type="button" onClick={() => setFaculty('')} className="btn-soft">
              Clear
            </button>
          )}
        </div>
      )}
      <div className="mb-5">
        <SegmentTabs tabs={tabs} activeCode={tab} onChange={setTab} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-faint">Loading posts...</p>
      ) : ads.length === 0 ? (
        <p className="card py-10 text-center text-sm text-muted">
          {tab === SAVED
            ? 'You have not saved any posts yet.'
            : tab === FOR_YOU
              ? 'No matches yet. Add your profile, or check back soon.'
              : 'No posts match.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {ads.map((ad) => {
            const { fg } = segmentColor(ad.category)
            const Ico = SEGMENT_ICONS[ad.category] ?? TrophyIcon
            const when = ad.deadline || ad.event_date
            return (
              <li key={ad.id} className="card card-hover flex gap-4 p-4">
                <button
                  type="button"
                  onClick={() => openAd(ad.id)}
                  className="flex min-w-0 flex-1 gap-4 text-left"
                >
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-white sm:h-24 sm:w-24"
                      style={{ background: `linear-gradient(135deg, ${fg}, #5b3ff8)` }}
                    >
                      <Ico className="h-8 w-8 sm:h-10 sm:w-10" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-semibold text-ink sm:truncate sm:text-lg">
                      {ad.title}
                    </span>
                    <span className="block truncate text-sm text-ink-2">
                      {ad.organisation_name}
                    </span>
                    <span className="mt-1 line-clamp-2 text-sm text-muted">{ad.description}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      {when && (
                        <span className="rounded-md bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger sm:hidden">
                          {shortDate(when)}
                        </span>
                      )}
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{ background: `${fg}1a`, color: fg }}
                      >
                        {segmentLabel(ad.category)}
                      </span>
                      {ad.faculty && (
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">
                          {ad.faculty.replace('Faculty of ', '')}
                        </span>
                      )}
                      {ad.recommendation === 'for_you' && (
                        <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                          For you
                        </span>
                      )}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                  {when && (
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-faint">{ad.deadline ? 'Deadline' : 'Date'}</p>
                      <p className="text-sm font-semibold text-ink">{shortDate(when)}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSave(ad)}
                    aria-pressed={ad.is_saved}
                    aria-label={ad.is_saved ? 'Remove bookmark' : 'Bookmark'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-accent hover:bg-accent-soft"
                  >
                    <BookmarkIcon className="h-5 w-5" filled={ad.is_saved} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {open && <AdDetail ad={open} onClose={() => setOpen(null)} onToggleSave={toggleSave} />}
    </div>
  )
}
