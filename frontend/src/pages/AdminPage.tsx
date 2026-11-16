import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  approveOrganisation,
  getStats,
  listAdminAds,
  listOrganisations,
  moderateAd,
  rejectOrganisation,
} from '../api/admin'
import { ApiError } from '../api/client'
import SegmentTabs from '../components/SegmentTabs'
import { segmentLabel } from '../segments'
import type { AdminAd, AdminOrganisation, Stats } from '../types/api'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('orgs')
  const [stats, setStats] = useState<Stats | null>(null)
  const [orgs, setOrgs] = useState<AdminOrganisation[]>([])
  const [ads, setAds] = useState<AdminAd[]>([])
  const [reportedOnly, setReportedOnly] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      else if (err instanceof ApiError && err.status === 403) setError('Admins only.')
      else setError(err instanceof Error ? err.message : 'Something went wrong.')
    },
    [navigate],
  )

  const load = useCallback(async () => {
    try {
      const [s, o, a] = await Promise.all([
        getStats(),
        listOrganisations('pending'),
        listAdminAds(reportedOnly),
      ])
      setStats(s)
      setOrgs(o)
      setAds(a)
    } catch (err) {
      handle(err)
    }
  }, [reportedOnly, handle])

  useEffect(() => {
    load()
  }, [load])

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn()
      await load()
    } catch (err) {
      handle(err)
    }
  }

  function reject(org: AdminOrganisation) {
    const note = window.prompt(`Reason for rejecting "${org.name}" (shown to the applicant):`)
    if (note) act(() => rejectOrganisation(org.id, note))
  }

  if (error === 'Admins only.') {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="py-10 text-center text-sm text-muted">This page is for admins only.</p>
      </div>
    )
  }

  const llm = stats?.llm
  const tokens = llm?.configured ? (llm.prompt_tokens ?? 0) + (llm.completion_tokens ?? 0) : null

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-ink">Admin</h1>
      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {stats && (
        <section className="mb-5 grid grid-cols-2 gap-2">
          <Stat label="Users" value={stats.users} />
          <Stat label="Active (7 days)" value={stats.active_users_7d} />
          <Stat label="Emails sorted" value={`${stats.emails_classified} / ${stats.emails}`} />
          <Stat label="Live posts" value={stats.ads_live} />
          <Stat label="Clubs pending" value={stats.organisations_pending} />
          <Stat label="Open reports" value={stats.reports_open} />
          <div className="col-span-2 rounded-xl border border-line bg-surface p-3 text-sm">
            <p className="text-xs text-muted">AI usage today</p>
            {llm?.configured ? (
              <p className="text-ink">
                {llm.requests} requests · {tokens?.toLocaleString()} tokens
                <span className="block text-xs text-faint">{llm.model}</span>
              </p>
            ) : (
              <p className="text-warn">AI not configured (LLM_API_KEY missing)</p>
            )}
          </div>
        </section>
      )}

      <div className="mb-4">
        <SegmentTabs
          tabs={[
            { code: 'orgs', label: 'Club applications', count: orgs.length },
            { code: 'ads', label: 'Posts', count: ads.length },
          ]}
          activeCode={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'orgs' && (
        <ul className="space-y-3">
          {orgs.length === 0 && <p className="text-sm text-faint">No pending applications.</p>}
          {orgs.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <p className="font-semibold text-ink">{o.name}</p>
              <p className="text-muted">
                {o.contact_email} · applied by {o.owner_email}
              </p>
              {o.faculty && <p className="text-muted">{o.faculty}</p>}
              {o.website && (
                <a
                  href={o.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  {o.website}
                </a>
              )}
              {o.description && <p className="mt-2 text-ink-2">{o.description}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => act(() => approveOrganisation(o.id))}
                  className="rounded-xl bg-success px-3 py-1.5 text-on-accent"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(o)}
                  className="rounded-xl border border-danger/40 px-3 py-1.5 text-danger"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'ads' && (
        <>
          <label className="mb-3 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={reportedOnly}
              onChange={(e) => setReportedOnly(e.target.checked)}
            />
            Only reported posts
          </label>
          <ul className="space-y-3">
            {ads.length === 0 && <p className="text-sm text-faint">Nothing to review.</p>}
            {ads.map((ad) => (
              <li key={ad.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                <p className="font-semibold text-ink">{ad.title}</p>
                <p className="text-muted">
                  {ad.organisation_name} · {segmentLabel(ad.category)} · {ad.status}
                </p>
                <p className="mt-1 line-clamp-3 text-ink-2">{ad.description}</p>
                {ad.report_reasons.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-danger">
                    {ad.report_reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {ad.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'approved'))}
                      className="rounded-xl bg-success px-3 py-1.5 text-on-accent"
                    >
                      {ad.status === 'pending' ? 'Approve' : 'Restore'}
                    </button>
                  )}
                  {ad.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'approved'))}
                      className="rounded-xl border border-line px-3 py-1.5 text-muted"
                    >
                      Keep (dismiss reports)
                    </button>
                  )}
                  {ad.status !== 'hidden' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'hidden'))}
                      className="rounded-xl border border-line-strong px-3 py-1.5 text-warn"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => act(() => moderateAd(ad.id, 'removed'))}
                    className="rounded-xl border border-danger/40 px-3 py-1.5 text-danger"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
