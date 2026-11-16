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
import NavBar from '../components/NavBar'
import SegmentTabs from '../components/SegmentTabs'
import { segmentLabel } from '../segments'
import type { AdminAd, AdminOrganisation, Stats } from '../types/api'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
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
      <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
        <NavBar />
        <p className="py-10 text-center text-sm text-slate-500">This page is for admins only.</p>
      </main>
    )
  }

  const llm = stats?.llm
  const tokens = llm?.configured ? (llm.prompt_tokens ?? 0) + (llm.completion_tokens ?? 0) : null

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <NavBar />
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Admin</h1>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
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
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">AI usage today</p>
            {llm?.configured ? (
              <p className="text-slate-800">
                {llm.requests} requests · {tokens?.toLocaleString()} tokens
                <span className="block text-xs text-slate-400">{llm.model}</span>
              </p>
            ) : (
              <p className="text-amber-700">AI not configured (LLM_API_KEY missing)</p>
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
          {orgs.length === 0 && <p className="text-sm text-slate-400">No pending applications.</p>}
          {orgs.map((o) => (
            <li key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <p className="font-semibold text-slate-900">{o.name}</p>
              <p className="text-slate-500">
                {o.contact_email} · applied by {o.owner_email}
              </p>
              {o.faculty && <p className="text-slate-500">{o.faculty}</p>}
              {o.website && (
                <a
                  href={o.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {o.website}
                </a>
              )}
              {o.description && <p className="mt-2 text-slate-700">{o.description}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => act(() => approveOrganisation(o.id))}
                  className="rounded-xl bg-green-600 px-3 py-1.5 text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(o)}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-red-600"
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
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={reportedOnly}
              onChange={(e) => setReportedOnly(e.target.checked)}
            />
            Only reported posts
          </label>
          <ul className="space-y-3">
            {ads.length === 0 && <p className="text-sm text-slate-400">Nothing to review.</p>}
            {ads.map((ad) => (
              <li key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-900">{ad.title}</p>
                <p className="text-slate-500">
                  {ad.organisation_name} · {segmentLabel(ad.category)} · {ad.status}
                </p>
                <p className="mt-1 line-clamp-3 text-slate-700">{ad.description}</p>
                {ad.report_reasons.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-red-600">
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
                      className="rounded-xl bg-green-600 px-3 py-1.5 text-white"
                    >
                      {ad.status === 'pending' ? 'Approve' : 'Restore'}
                    </button>
                  )}
                  {ad.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'approved'))}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600"
                    >
                      Keep (dismiss reports)
                    </button>
                  )}
                  {ad.status !== 'hidden' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'hidden'))}
                      className="rounded-xl border border-amber-300 px-3 py-1.5 text-amber-700"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => act(() => moderateAd(ad.id, 'removed'))}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
