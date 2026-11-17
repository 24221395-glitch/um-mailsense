import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, signIn } from '../api/auth'
import { ApiError } from '../api/client'
import { getSegmentCounts, listEmails, processEmails, syncNow } from '../api/emails'
import { getProfile } from '../api/profile'
import EmailCard from '../components/EmailCard'
import SegmentTabs from '../components/SegmentTabs'
import { RefreshIcon, SEGMENT_ICONS, SparkleIcon } from '../components/icons'
import { SEGMENT_ORDER, UNSORTED, segmentLabel } from '../segments'
import type { Email, ProcessResult, SegmentCount, User } from '../types/api'

const FOR_YOU = 'FOR_YOU'

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  // the selected segment lives in the URL so the sidebar's "For You" link works too
  const [params, setParams] = useSearchParams()
  const activeCode = params.get('segment') || 'ALL'
  const setActiveCode = useCallback(
    (code: string) => setParams(code === 'ALL' ? {} : { segment: code }),
    [setParams],
  )
  const [emails, setEmails] = useState<Email[]>([])
  const [counts, setCounts] = useState<SegmentCount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [checking, setChecking] = useState(true) // looking for new mail on open
  const [work, setWork] = useState<ProcessResult | null>(null) // AI work left
  const [stalls, setStalls] = useState(0)
  const opened = useRef(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
    },
    [navigate],
  )

  const load = useCallback(async () => {
    try {
      const query =
        activeCode === FOR_YOU
          ? { forYou: true }
          : { segment: activeCode === 'ALL' ? undefined : activeCode }
      const [page, segCounts] = await Promise.all([
        listEmails({ ...query, pageSize: 50 }),
        getSegmentCounts(),
      ])
      setEmails(page.items)
      setCounts(segCounts)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [activeCode, handleError])

  useEffect(() => {
    getMe().then(setUser).catch(handleError)
    getProfile()
      .then((p) => setHasProfile(p !== null))
      .catch(() => setHasProfile(null))
  }, [handleError])

  useEffect(() => {
    load()
  }, [load])

  // On open: fetch new mail if a sync is due, then start sorting. This replaces a
  // background timer, so it also works on serverless hosting.
  useEffect(() => {
    if (opened.current) return
    opened.current = true
    syncNow(true)
      .catch(handleError)
      .finally(async () => {
        setChecking(false)
        await load()
        processEmails()
          .then(setWork)
          .catch(() => {})
      })
  }, [handleError, load])

  // While emails are "Sorting…", ask the server to process the next small batch.
  // Stop after 3 calls without progress (or when the AI is not set up).
  const pending = work ? work.unsorted + work.unscored : 0
  const keepWorking = !!work && work.ai_ready && pending > 0 && stalls < 3
  useEffect(() => {
    if (!keepWorking || !work) return
    const timer = window.setTimeout(async () => {
      try {
        const next = await processEmails()
        const stuck = next.unsorted === work.unsorted && next.unscored === work.unscored
        setStalls((n) => (stuck ? n + 1 : 0))
        setWork(next)
        load()
      } catch {
        setStalls((n) => n + 1)
      }
    }, 800)
    return () => window.clearTimeout(timer)
  }, [keepWorking, work, load])
  const unsortedCount = counts.find((c) => c.code === null)?.total ?? 0

  const byCode = useMemo(() => new Map(counts.map((c) => [c.code ?? UNSORTED, c])), [counts])
  const tiles = SEGMENT_ORDER.filter((c) => c !== 'NOT_FOR_ME')

  const tabs = useMemo(() => {
    const total = counts.reduce((sum, c) => sum + c.total, 0)
    return [
      { code: 'ALL', label: 'All', count: total },
      { code: FOR_YOU, label: '★ For you' },
      {
        code: 'NOT_FOR_ME',
        label: segmentLabel('NOT_FOR_ME'),
        count: byCode.get('NOT_FOR_ME')?.total ?? 0,
      },
      ...(byCode.has(UNSORTED)
        ? [{ code: UNSORTED, label: 'Sorting…', count: byCode.get(UNSORTED)!.total }]
        : []),
    ]
  }, [counts, byCode])

  const unreadCount = counts.reduce((sum, c) => sum + c.unread, 0)
  const reconnect = user?.accounts.find((a) => a.needs_reconnect)

  async function handleSync() {
    setSyncing(true)
    setStalls(0)
    try {
      await syncNow()
      await load()
      setWork(await processEmails())
    } catch (err) {
      handleError(err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Inbox</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-ink sm:text-3xl">
            Your Inbox, Organised by AI <SparkleIcon className="h-5 w-5 text-accent" />
          </h1>
          <p className="mt-1 text-sm text-muted">
            {unreadCount} new emails{user && <span className="text-faint"> · {user.email}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="btn-ghost py-2 text-sm"
        >
          <RefreshIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Refresh'}
        </button>
      </header>

      {reconnect && (
        <div role="alert" className="mb-4 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          We lost access to {reconnect.email}.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => signIn(reconnect.provider)}
          >
            Reconnect
          </button>
        </div>
      )}

      {keepWorking && work && (
        <p role="status" className="mb-4 flex items-center gap-2 text-sm text-accent">
          <SparkleIcon className="h-4 w-4 animate-spin" />
          {work.unsorted > 0
            ? `Sorting ${work.unsorted} email${work.unsorted === 1 ? '' : 's'} with AI…`
            : 'Finding what is for you…'}
        </p>
      )}
      {work && !work.ai_ready && unsortedCount > 0 && (
        <p role="status" className="mb-4 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          AI sorting is not available right now. Your emails are safe and will be sorted once it is
          back.
        </p>
      )}

      {hasProfile === false && (
        <Link
          to="/profile"
          className="mb-4 block rounded-xl bg-accent-soft p-3 text-sm text-accent"
        >
          <span className="font-semibold">Upload your CV</span> to see which emails are for you →
        </Link>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        {tiles.map((code) => {
          const Ico = SEGMENT_ICONS[code]
          const c = byCode.get(code)
          const active = activeCode === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => setActiveCode(active ? 'ALL' : code)}
              aria-pressed={active}
              className={`rounded-2xl border px-2 py-4 text-center transition ${
                active
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <Ico className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-2 text-sm font-medium leading-tight text-ink">
                {segmentLabel(code)}
              </p>
              <p className="mt-0.5 text-xs text-muted">{c?.unread ?? 0} new</p>
            </button>
          )
        })}
      </div>

      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={activeCode} onChange={setActiveCode} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-faint">Loading your inbox…</p>
      ) : emails.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">
          {checking
            ? 'Checking for new mail…'
            : activeCode === FOR_YOU
              ? hasProfile
                ? 'Nothing matched your profile yet. Recommendations update as mail arrives.'
                : 'Add your profile to get recommendations.'
              : 'No emails here.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {emails.map((email) => (
            <li key={email.id}>
              <EmailCard
                id={email.id}
                senderName={email.sender_name}
                subject={email.subject}
                snippet={email.snippet}
                receivedAt={email.received_at}
                isRead={email.is_read}
                segmentLabel={segmentLabel(email.segment)}
                deadlineLabel={email.deadline ? `Due ${formatDay(email.deadline)}` : undefined}
                recommendation={email.recommendation}
                recommendationReason={email.recommendation_reason ?? undefined}
                isOfficial={email.segment === 'UM_NOTICE'}
                onClick={(id) => navigate(`/emails/${id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
