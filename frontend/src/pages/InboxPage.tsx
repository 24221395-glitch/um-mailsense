import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, signIn, signOut } from '../api/auth'
import { ApiError } from '../api/client'
import { getSegmentCounts, listEmails, syncNow } from '../api/emails'
import EmailCard from '../components/EmailCard'
import SegmentTabs from '../components/SegmentTabs'
import { SEGMENT_ORDER, UNSORTED, segmentLabel } from '../segments'
import type { Email, SegmentCount, User } from '../types/api'

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

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
    },
    [navigate],
  )

  const load = useCallback(async () => {
    try {
      const segment = activeCode === 'ALL' ? undefined : activeCode
      const [page, segCounts] = await Promise.all([
        listEmails({ segment, pageSize: 50 }),
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
  }, [handleError])

  useEffect(() => {
    load()
  }, [load])

  // The first sync after sign-in runs in the background: poll for ~30 s until mail appears.
  const waitingForFirstSync = !loading && emails.length === 0 && activeCode === 'ALL' && polls < 10
  useEffect(() => {
    if (!waitingForFirstSync) return
    const timer = window.setTimeout(() => {
      setPolls((n) => n + 1)
      load()
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [waitingForFirstSync, polls, load])

  const tabs = useMemo(() => {
    const byCode = new Map(counts.map((c) => [c.code ?? UNSORTED, c]))
    const total = counts.reduce((sum, c) => sum + c.total, 0)
    const ordered = [...SEGMENT_ORDER, UNSORTED].filter((code) => byCode.has(code))
    return [
      { code: 'ALL', label: 'All', count: total },
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

      <div className="mb-4">
        <SegmentTabs tabs={tabs} activeCode={activeCode} onChange={setActiveCode} />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading your inbox…</p>
      ) : emails.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          {activeCode === 'ALL'
            ? 'Fetching your emails… this can take a moment.'
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
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
