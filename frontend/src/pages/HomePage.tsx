import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAds, saveAd, unsaveAd } from '../api/ads'
import { getMe } from '../api/auth'
import { getDeadlines } from '../api/calendar'
import { ApiError } from '../api/client'
import { getSegmentCounts, listEmails } from '../api/emails'
import {
  ArrowRightIcon,
  BellIcon,
  BookmarkIcon,
  CalendarIcon,
  MailIcon,
  RefreshIcon,
  SEGMENT_ICONS,
  SparkleIcon,
  StarIcon,
} from '../components/icons'
import { Mascot } from '../components/Illustrations'
import SegmentTile from '../components/SegmentTile'
import { useMailSync } from '../hooks/useMailSync'
import { TILE_SEGMENTS, segmentColor, segmentLabel } from '../segments'
import type { Ad, CalendarItem, Email, SegmentCount, User } from '../types/api'

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function firstName(user: User | null): string {
  if (!user) return ''
  if (user.name) return user.name.split(' ')[0]!
  return user.email.split('@')[0]!
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({
  Icon,
  value,
  label,
  color,
}: {
  Icon: typeof MailIcon
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1a`, color }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-muted sm:text-sm">{label}</p>
      </div>
    </div>
  )
}

function Thumb({ code }: { code: string | null }) {
  const Ico = SEGMENT_ICONS[code ?? ''] ?? MailIcon
  const { fg } = segmentColor(code)
  return (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
      style={{ background: `linear-gradient(135deg, ${fg}, #5b3ff8)` }}
    >
      <Ico className="h-7 w-7" />
    </span>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [counts, setCounts] = useState<SegmentCount[]>([])
  const [forYou, setForYou] = useState<Email[]>([])
  const [forYouTotal, setForYouTotal] = useState(0)
  const [deadlines, setDeadlines] = useState<CalendarItem[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [tab, setTab] = useState<'recommended' | 'new'>('recommended')

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
    },
    [navigate],
  )

  const load = useCallback(async () => {
    try {
      const [segs, rec] = await Promise.all([
        getSegmentCounts(),
        listEmails({ forYou: true, pageSize: 5 }),
      ])
      setCounts(segs)
      setForYou(rec.items)
      setForYouTotal(rec.total)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const sync = useMailSync(load, handleError)

  useEffect(() => {
    getMe().then(setUser).catch(handleError)
    load()
    const now = new Date()
    getDeadlines(now, new Date(now.getTime() + 14 * 24 * 3600 * 1000))
      .then((items) => setDeadlines(items.filter((i) => i.date_type === 'deadline')))
      .catch(() => {})
    listAds({})
      .then((page) => setAds(page.items.slice(0, 5)))
      .catch(() => {})
  }, [handleError, load])

  const byCode = useMemo(() => new Map(counts.map((c) => [c.code, c])), [counts])
  const total = counts.reduce((sum, c) => sum + c.total, 0)
  const sorted = total - (byCode.get(null)?.total ?? 0)

  async function toggleSave(ad: Ad) {
    const next = !ad.is_saved
    setAds((list) => list.map((a) => (a.id === ad.id ? { ...a, is_saved: next } : a)))
    try {
      await (next ? saveAd(ad.id) : unsaveAd(ad.id))
    } catch {
      /* will show the true state on next load */
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* greeting */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {greeting()}
            {user && `, ${firstName(user)}`} 👋
          </h1>
          <p className="mt-1 text-muted">Here&apos;s your UM mail at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/calendar"
            aria-label={`${deadlines.length} upcoming deadlines`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-sm hover:border-accent hover:text-accent"
          >
            <BellIcon className="h-5 w-5" />
            {deadlines.length > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </Link>
          <button
            type="button"
            onClick={sync.refresh}
            disabled={sync.syncing}
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-2 shadow-sm hover:border-accent hover:text-accent"
          >
            <RefreshIcon className={`h-4 w-4 ${sync.busy ? 'animate-spin' : ''}`} />
            {sync.busy ? 'Syncing…' : 'Up to date'}
          </button>
        </div>
      </header>

      {/* stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard Icon={MailIcon} value={total} label="Total Emails" color="#5b3ff8" />
        <StatCard Icon={SparkleIcon} value={sorted} label="AI Sorted" color="#7c5cff" />
        <StatCard
          Icon={CalendarIcon}
          value={deadlines.length}
          label="Upcoming Deadlines"
          color="#f0436b"
        />
        <StatCard Icon={StarIcon} value={forYouTotal} label="Recommended" color="#f59e0b" />
      </section>

      {/* AI banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-2 to-accent px-6 py-6 text-white shadow-xl sm:px-8">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {sync.keepWorking ? 'AI is organising your inbox…' : 'AI has organised your inbox'}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {sync.keepWorking && sync.work
              ? `Sorting ${sync.work.unsorted} more email${sync.work.unsorted === 1 ? '' : 's'} and finding what is for you.`
              : 'Your emails are automatically classified and prioritised.'}
          </p>
        </div>
        <SparkleIcon className="absolute right-40 top-5 hidden h-5 w-5 text-white/70 sm:block" />
        <SparkleIcon className="absolute right-56 bottom-6 hidden h-4 w-4 text-white/50 sm:block" />
        <Mascot className="absolute -bottom-10 right-4 hidden w-40 sm:block" />
      </section>

      {/* segments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Email Segments</h2>
          <Link to="/inbox" className="flex items-center gap-1 text-sm font-semibold text-accent">
            View All <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TILE_SEGMENTS.map((code) => (
            <SegmentTile
              key={code}
              code={code}
              newCount={byCode.get(code)?.unread ?? 0}
              onClick={() => navigate(`/inbox?segment=${code}`)}
            />
          ))}
        </div>
      </section>

      {/* for you */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            For You <SparkleIcon className="h-4 w-4 text-warn" />
          </h2>
          <div className="flex gap-2" role="tablist">
            {(
              [
                ['recommended', 'Recommended'],
                ['new', 'New & Popular'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === key
                    ? 'bg-gradient-to-r from-accent-2 to-accent text-white shadow-md'
                    : 'border border-line bg-surface text-ink-2 hover:border-accent hover:text-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-3">
          {tab === 'recommended' &&
            (forYou.length === 0 ? (
              <li className="card p-6 text-center text-sm text-muted">
                No recommendations yet.{' '}
                <Link to="/profile" className="font-semibold text-accent">
                  Upload your CV
                </Link>{' '}
                so MailSense can find what fits you.
              </li>
            ) : (
              forYou.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/emails/${e.id}`}
                    className="card card-hover flex items-center gap-4 p-4"
                  >
                    <Thumb code={e.segment} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{e.subject}</p>
                      <p className="truncate text-sm text-muted">
                        {e.sender_name} · {segmentLabel(e.segment)}
                      </p>
                      {e.recommendation_reason && (
                        <p className="mt-0.5 truncate text-xs text-success">
                          {e.recommendation_reason}
                        </p>
                      )}
                    </div>
                    {e.deadline && (
                      <span className="hidden shrink-0 rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger sm:inline">
                        Deadline: {shortDate(e.deadline)}
                      </span>
                    )}
                  </Link>
                </li>
              ))
            ))}
          {tab === 'new' &&
            (ads.length === 0 ? (
              <li className="card p-6 text-center text-sm text-muted">
                No posts on the board yet.
              </li>
            ) : (
              ads.map((ad) => (
                <li key={ad.id} className="card card-hover flex items-center gap-4 p-4">
                  <Thumb code={ad.category} />
                  <Link to="/board" className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{ad.title}</p>
                    <p className="truncate text-sm text-muted">
                      {ad.organisation_name} · {segmentLabel(ad.category)}
                    </p>
                  </Link>
                  {ad.deadline && (
                    <span className="hidden shrink-0 rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger sm:inline">
                      Deadline: {shortDate(ad.deadline)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSave(ad)}
                    aria-pressed={ad.is_saved}
                    aria-label={ad.is_saved ? 'Remove bookmark' : 'Bookmark'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-accent hover:bg-accent-soft"
                  >
                    <BookmarkIcon className="h-5 w-5" filled={ad.is_saved} />
                  </button>
                </li>
              ))
            ))}
        </ul>
      </section>
    </div>
  )
}
