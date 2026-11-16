import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAd, deleteAd, myAds, updateAd } from '../api/ads'
import { ApiError } from '../api/client'
import { applyOrganisation, getMyOrganisation, updateMyOrganisation } from '../api/organisations'
import NavBar from '../components/NavBar'
import { AD_CATEGORIES, FACULTIES } from '../faculties'
import { segmentLabel } from '../segments'
import type { AdInput, MyAd, Organisation, OrganisationInput } from '../types/api'

const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const label = 'block text-sm font-medium text-slate-700'

/** ISO (UTC) -> "YYYY-MM-DDTHH:mm" in Malaysia time, for <input type="datetime-local">. */
function toMyt(iso: string | null): string {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + 8 * 3600_000).toISOString().slice(0, 16)
}

const EMPTY_AD: AdInput = {
  title: '',
  description: '',
  category: 'EVENT',
  event_date: null,
  deadline: null,
  venue: null,
  link: null,
  image_url: null,
  faculty: null,
  target_fields: [],
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.'
}

function OrgForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: OrganisationInput
  submitLabel: string
  onSubmit: (v: OrganisationInput) => Promise<void>
}) {
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ ...v, website: v.website || null, faculty: v.faculty || null })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className={label}>
        Organisation name
        <input
          required
          minLength={2}
          value={v.name}
          className={input}
          onChange={(e) => setV({ ...v, name: e.target.value })}
        />
      </label>
      <label className={label}>
        Official contact email
        <input
          required
          type="email"
          value={v.contact_email}
          className={input}
          onChange={(e) => setV({ ...v, contact_email: e.target.value })}
        />
      </label>
      <label className={label}>
        Website or social page (optional)
        <input
          type="url"
          placeholder="https://"
          value={v.website ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, website: e.target.value })}
        />
      </label>
      <label className={label}>
        Faculty (optional)
        <select
          value={v.faculty ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, faculty: e.target.value })}
        >
          <option value="">University-wide</option>
          {FACULTIES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        About your organisation
        <textarea
          rows={3}
          value={v.description}
          className={input}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}

function AdForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: AdInput
  onSubmit: (v: AdInput) => Promise<void>
  onCancel: () => void
}) {
  const [v, setV] = useState({
    ...initial,
    event_date: toMyt(initial.event_date),
    deadline: toMyt(initial.deadline),
  })
  const [fields, setFields] = useState(initial.target_fields.join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        ...v,
        event_date: v.event_date || null, // naive time = Malaysia time on the server
        deadline: v.deadline || null,
        venue: v.venue || null,
        link: v.link || null,
        image_url: v.image_url || null,
        faculty: v.faculty || null,
        target_fields: fields
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-blue-200 bg-white p-4">
      <label className={label}>
        Title
        <input
          required
          minLength={3}
          maxLength={200}
          value={v.title}
          className={input}
          onChange={(e) => setV({ ...v, title: e.target.value })}
        />
      </label>
      <label className={label}>
        Category
        <select
          value={v.category}
          className={input}
          onChange={(e) => setV({ ...v, category: e.target.value })}
        >
          {AD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {segmentLabel(c)}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Description
        <textarea
          rows={4}
          value={v.description}
          className={input}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          Event date
          <input
            type="datetime-local"
            value={v.event_date ?? ''}
            className={input}
            onChange={(e) => setV({ ...v, event_date: e.target.value })}
          />
        </label>
        <label className={label}>
          Register by
          <input
            type="datetime-local"
            value={v.deadline ?? ''}
            className={input}
            onChange={(e) => setV({ ...v, deadline: e.target.value })}
          />
        </label>
      </div>
      <label className={label}>
        Venue
        <input
          value={v.venue ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, venue: e.target.value })}
        />
      </label>
      <label className={label}>
        Registration link
        <input
          type="url"
          placeholder="https://"
          value={v.link ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, link: e.target.value })}
        />
      </label>
      <label className={label}>
        Poster image link (optional)
        <input
          type="url"
          placeholder="https://…/poster.jpg"
          value={v.image_url ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, image_url: e.target.value })}
        />
      </label>
      <label className={label}>
        Who is it for?
        <select
          value={v.faculty ?? ''}
          className={input}
          onChange={(e) => setV({ ...v, faculty: e.target.value })}
        >
          <option value="">All faculties</option>
          {FACULTIES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        Target fields or skills (comma separated, helps recommendations)
        <input
          value={fields}
          placeholder="e.g. Computer Science, Python"
          className={input}
          onChange={(e) => setFields(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Publish'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  hidden: 'bg-slate-200 text-slate-600',
}

export default function OrganisationPage() {
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organisation | null>(null)
  const [ads, setAds] = useState<MyAd[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MyAd | 'new' | null>(null)
  const [editOrg, setEditOrg] = useState(false)

  const loadAds = useCallback(
    () =>
      myAds()
        .then(setAds)
        .catch(() => setAds([])),
    [],
  )

  useEffect(() => {
    getMyOrganisation()
      .then((o) => {
        setOrg(o)
        if (o?.status === 'approved') loadAds()
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate, loadAds])

  async function saveAd(v: AdInput) {
    if (editing === 'new') await createAd(v)
    else if (editing) await updateAd(editing.id, v)
    setEditing(null)
    await loadAds()
  }

  async function removeAd(ad: MyAd) {
    if (!window.confirm(`Delete "${ad.title}"? This cannot be undone.`)) return
    await deleteAd(ad.id)
    await loadAds()
  }

  if (loading) return <p className="p-10 text-center text-sm text-slate-400">Loading…</p>

  const orgInput: OrganisationInput = org
    ? {
        name: org.name,
        description: org.description,
        contact_email: org.contact_email,
        website: org.website,
        faculty: org.faculty,
      }
    : { name: '', description: '', contact_email: '', website: null, faculty: null }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 p-4">
      <NavBar />
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        {org ? org.name : 'Register your club'}
      </h1>

      {!org && (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Verified clubs and offices can post programmes on the community board. An admin checks
            every application.
          </p>
          <OrgForm
            initial={orgInput}
            submitLabel="Apply for verification"
            onSubmit={async (v) => setOrg(await applyOrganisation(v))}
          />
        </>
      )}

      {org && org.status !== 'approved' && (
        <div className="space-y-4">
          <p
            role="status"
            className={`rounded-xl p-3 text-sm ${
              org.status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {org.status === 'pending'
              ? 'Your application is waiting for an admin. You can post once it is approved.'
              : `Your application was not approved${org.review_note ? `: ${org.review_note}` : '.'} Update the details below to apply again.`}
          </p>
          {editOrg || org.status === 'rejected' ? (
            <OrgForm
              initial={orgInput}
              submitLabel={org.status === 'rejected' ? 'Apply again' : 'Save changes'}
              onSubmit={async (v) => {
                setOrg(await updateMyOrganisation(v))
                setEditOrg(false)
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditOrg(true)}
              className="text-sm text-blue-600"
            >
              Edit application
            </button>
          )}
        </div>
      )}

      {org?.status === 'approved' && (
        <div className="space-y-4">
          <p className="text-sm text-green-700">✓ Verified organisation</p>
          {editing ? (
            <AdForm
              initial={editing === 'new' ? EMPTY_AD : editing}
              onSubmit={saveAd}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              + New post
            </button>
          )}

          <h2 className="pt-2 font-semibold text-slate-900">Your posts</h2>
          {ads.length === 0 && <p className="text-sm text-slate-400">No posts yet.</p>}
          <ul className="space-y-3">
            {ads.map((ad) => (
              <li key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{ad.title}</p>
                    <p className="text-xs text-slate-500">{segmentLabel(ad.category)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[ad.status] ?? ''
                    }`}
                  >
                    {ad.status === 'approved' ? 'Live' : ad.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  👁 {ad.views} views · ♥ {ad.saves} saves
                  {ad.open_reports > 0 && (
                    <span className="text-red-600"> · ⚑ {ad.open_reports} reports</span>
                  )}
                </p>
                <div className="mt-2 flex gap-3 text-sm">
                  <button type="button" onClick={() => setEditing(ad)} className="text-blue-600">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeAd(ad)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
