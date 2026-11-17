import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, signIn } from '../api/auth'
import { ApiError } from '../api/client'
import { getSegmentCounts, listEmails } from '../api/emails'
import { getProfile } from '../api/profile'
import EmailCard from '../components/EmailCard'
import SegmentTabs from '../components/SegmentTabs'
import SegmentTile from '../components/SegmentTile'
import { RefreshIcon, SparkleIcon } from '../components/icons'
import { useMailSync } from '../hooks/useMailSync'
import { TILE_SEGMENTS, UNSORTED, segmentLabel } from '../segments'
import type { Email, SegmentCount, User } from '../types/api'

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

  const sync = useMailSync(load, handleError)

  useEffect(() => {
    getMe().then(setUser).catch(handleError)
    getProfile()
      .then((p) => setHasProfile(p !== null))
      .catch(() => setHasProfile(null))
  }, [handleError])

  useEffect(() => {
    load()
  }, [load])

  const byCode = useMemo(() => new Map(counts.map((c) => [c.code ?? UNSORTED, c])), [counts])
  const unsortedCount = byCode.get(UNSORTED)?.total ?? 0

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
      ...(unsortedCount ? [{ code: UNSORTED, label: 'Sorting…', count: unsortedCount }] : []),
    ]
  }, [counts, byCode, unsortedCount])

  const unreadCount = counts.reduce((sum, c) => sum + c.unread, 0)
  const reconnect = user?.accounts.find((a) => a.needs_reconnect)
  const { work } = sync

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink sm:text-3xl">
            Your Inbox, Organised by AI <SparkleIcon className="h-5 w-5 text-accent" />
          </h1>
          <p className="mt-1 text-sm text-muted">
            {unreadCount} new emails{user && <span className="text-faint"> · {user.email}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={sync.refresh}
          disabled={sync.syncing}
          className="btn-ghost py-2.5 text-sm"
        >
          <RefreshIcon className={`h-4 w-4 ${sync.syncing ? 'animate-spin' : ''}`} />
          {sync.syncing ? 'Syncing…' : 'Refresh'}
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
      {sync.keepWorking && work && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl bg-accent-soft p-3 text-sm font-medium text-accent"
        >
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
          className="mb-4 flex items-center justify-between rounded-xl bg-accent-soft p-3 text-sm text-accent hover:bg-accent hover:text-white"
        >
          <span>
            <span className="font-semibold">Upload your CV</span> to see which emails are for you
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {TILE_SEGMENTS.map((code) => (
          <SegmentTile
            key={code}
            code={code}
            newCount={byCode.get(code)?.unread ?? 0}
            active={activeCode === code}
            onClick={() => setActiveCode(activeCode === code ? 'ALL' : code)}
          />
        ))}
      </div>

      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={activeCode} onChange={setActiveCode} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-faint">Loading your inbox…</p>
      ) : emails.length === 0 ? (
        <p className="card py-10 text-center text-sm text-muted">
          {sync.checking
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
                segmentCode={email.segment}
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
