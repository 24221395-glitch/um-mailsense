import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe, signIn, signOut } from '../api/auth'
import { ApiError } from '../api/client'
import { getSegmentCounts, listEmails, syncNow } from '../api/emails'
import { getProfile } from '../api/profile'
import EmailCard from '../components/EmailCard'
import SegmentTabs from '../components/SegmentTabs'
import { SEGMENT_ORDER, UNSORTED, segmentLabel } from '../segments'
import type { Email, SegmentCount, User } from '../types/api'

const FOR_YOU = 'FOR_YOU'

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [activeCode, setActiveCode] = useState('ALL')
  const [emails, setEmails] = useState<Email[]>([])
  const [counts, setCounts] = useState<SegmentCount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [polls, setPolls] = useState(0)
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

  // Sync and AI sorting run in the background. Poll while waiting for the first emails
  // (~30 s) or while some are still "Sorting…" (~3 min), then stop.
  const unsortedCount = counts.find((c) => c.code === null)?.total ?? 0
  const waitingForFirstSync = !loading && emails.length === 0 && activeCode === 'ALL' && polls < 10
  const waitingForAi = !loading && unsortedCount > 0 && polls < 60
  useEffect(() => {
    if (!waitingForFirstSync && !waitingForAi) return
    const timer = window.setTimeout(() => {
      setPolls((n) => n + 1)
      load()
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [waitingForFirstSync, waitingForAi, polls, load])

  const tabs = useMemo(() => {
    const byCode = new Map(counts.map((c) => [c.code ?? UNSORTED, c]))
    const total = counts.reduce((sum, c) => sum + c.total, 0)
    const ordered = [...SEGMENT_ORDER, UNSORTED].filter((code) => byCode.has(code))
    return [
      { code: 'ALL', label: 'All', count: total },
      { code: FOR_YOU, label: '★ For you' },
      ...ordered.map((code) => ({
        code,
        label: code === UNSORTED ? 'Sorting…' : segmentLabel(code),
        count: byCode.get(code)!.total,
      })),
    ]
  }, [counts])

  const unreadCount = counts.reduce((sum, c) => sum + c.unread, 0)
  const reconnect = user?.accounts.find((a) => a.needs_reconnect)
  const hasGoogle = user?.accounts.some((a) => a.provider === 'google')
  const hasMicrosoft = user?.accounts.some((a) => a.provider === 'microsoft')

  async function handleSync() {
    setSyncing(true)
    setPolls(0)
    try {
      await syncNow()
      await load()
    } catch (err) {
      handleError(err)
    } finally {
      setSyncing(false)
    }
  }

  async function handleSignOut() {
    await signOut().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="text-sm text-slate-500">{unreadCount} new emails</p>
          {user && <p className="truncate text-xs text-slate-400">{user.email}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to="/profile"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {reconnect && (
        <div role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
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

      {user && (!hasGoogle || !hasMicrosoft) && (
        <p className="mb-4 text-xs text-slate-500">
          Also use {hasMicrosoft ? 'Gmail' : 'Siswamail'}?{' '}
          <button
            type="button"
            className="font-medium text-blue-600"
            onClick={() => signIn(hasMicrosoft ? 'google' : 'microsoft')}
          >
            Connect it
          </button>
        </p>
      )}

      {hasProfile === false && (
        <Link to="/profile" className="mb-4 block rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-semibold">Upload your CV</span> to see which emails are for you →
        </Link>
      )}

      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={activeCode} onChange={setActiveCode} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading your inbox…</p>
      ) : emails.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          {waitingForFirstSync
            ? 'Fetching your emails… this can take a moment.'
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
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
