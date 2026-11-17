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
import {
  BuildingIcon,
  FileIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  UsersIcon,
} from '../components/icons'
import { SEGMENT_ORDER, segmentColor, segmentLabel } from '../segments'
import type { AdminAd, AdminOrganisation, Stats } from '../types/api'

function Stat({
  label,
  value,
  Icon,
  color,
}: {
  label: string
  value: string | number
  Icon: typeof UsersIcon
  color: string
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1a`, color }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}

/** Donut chart of emails per segment (last 30 days). */
function SegmentDonut({ data = {} }: { data?: Record<string, number> }) {
  const entries = SEGMENT_ORDER.filter((c) => data[c]).map((c) => [c, data[c]!] as const)
  const total = entries.reduce((sum, [, n]) => sum + n, 0)
  const r = 70
  const circ = 2 * Math.PI * r
  // each slice starts where the previous ones end
  const arcs = entries.map(([code, n], i) => ({
    code,
    len: (n / total) * circ,
    start: entries.slice(0, i).reduce((sum, [, m]) => sum + (m / total) * circ, 0),
  }))
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-ink">Email Segments (Last 30 Days)</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-muted">No sorted emails yet.</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <svg
            viewBox="0 0 180 180"
            className="h-44 w-44 shrink-0"
            role="img"
            aria-label={`${total} emails by segment`}
          >
            <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="26" />
            {arcs.map(({ code, len, start }) => (
              <circle
                key={code}
                cx="90"
                cy="90"
                r={r}
                fill="none"
                stroke={segmentColor(code).fg}
                strokeWidth="26"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-start}
                transform="rotate(-90 90 90)"
              />
            ))}
            <text
              x="90"
              y="88"
              textAnchor="middle"
              fontSize="24"
              fontWeight="700"
              fill="var(--ink)"
            >
              {total.toLocaleString()}
            </text>
            <text x="90" y="108" textAnchor="middle" fontSize="12" fill="var(--muted)">
              Emails
            </text>
          </svg>
          <ul className="min-w-0 flex-1 space-y-2 text-sm">
            {entries.map(([code, n]) => (
              <li key={code} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-ink-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: segmentColor(code).fg }}
                  />
                  {segmentLabel(code)}
                </span>
                <span className="font-semibold text-ink">{Math.round((n / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Admin Dashboard</h1>
      <p className="mb-5 mt-1 text-muted">Manage organisations, posts and system usage.</p>
      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {stats && (
        <section className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Stat Icon={UsersIcon} color="#5b3ff8" label="Total Students" value={stats.users} />
            <Stat
              Icon={BuildingIcon}
              color="#7c5cff"
              label="Organisations"
              value={stats.organisations_approved}
            />
            <Stat Icon={FileIcon} color="#10b981" label="Active Posts" value={stats.ads_live} />
            <Stat
              Icon={StarIcon}
              color="#3b82f6"
              label="Active (7 days)"
              value={stats.active_users_7d}
            />
            <Stat
              Icon={SparkleIcon}
              color="#f59e0b"
              label="Emails sorted"
              value={`${stats.emails_classified.toLocaleString()} / ${stats.emails.toLocaleString()}`}
            />
            <Stat
              Icon={ShieldIcon}
              color="#f0436b"
              label="Open reports"
              value={stats.reports_open}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <SegmentDonut data={stats.segments_30d} />
            <div className="card p-5">
              <h2 className="font-semibold text-ink">AI usage today</h2>
              {llm?.configured ? (
                <>
                  <p className="mt-3 text-3xl font-bold text-ink">{tokens?.toLocaleString()}</p>
                  <p className="text-sm text-muted">tokens in {llm.requests} requests</p>
                  <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">
                    {llm.model}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-warn">AI not configured (LLM_API_KEY missing)</p>
              )}
              <p className="mt-4 text-sm text-muted">
                Clubs waiting for review:{' '}
                <span className="font-semibold text-ink">{stats.organisations_pending}</span>
              </p>
            </div>
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
                  className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110"
                >
                  Approve
                </button>
                <button type="button" onClick={() => reject(o)} className="btn-danger py-2">
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
                      className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110"
                    >
                      {ad.status === 'pending' ? 'Approve' : 'Restore'}
                    </button>
                  )}
                  {ad.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'approved'))}
                      className="btn-ghost py-2 text-sm"
                    >
                      Keep (dismiss reports)
                    </button>
                  )}
                  {ad.status !== 'hidden' && (
                    <button
                      type="button"
                      onClick={() => act(() => moderateAd(ad.id, 'hidden'))}
                      className="rounded-xl border-2 border-warn/40 px-4 py-2 text-sm font-semibold text-warn hover:bg-warn-soft"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => act(() => moderateAd(ad.id, 'removed'))}
                    className="btn-danger py-2"
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
