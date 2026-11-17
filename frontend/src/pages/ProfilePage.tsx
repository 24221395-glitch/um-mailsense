import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { PlusIcon, UploadIcon } from '../components/icons'
import { deleteProfile, getProfile, saveProfile, uploadCv } from '../api/profile'
import type { Profile, ProfileInput } from '../types/api'

const EMPTY: ProfileInput = { field_of_study: '', year_of_study: null, skills: [], interests: [] }

function TagEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v])
    setDraft('')
  }

  return (
    <div>
      <span className="text-sm font-medium text-ink-2">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-accent/70 hover:text-accent-2"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          aria-label={`Add ${label.toLowerCase()}`}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        />
        <button type="button" onClick={add} className="btn-soft">
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<ProfileInput>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'upload' | 'save' | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  function show(p: Profile | null) {
    setProfile(p)
    setForm(
      p
        ? {
            field_of_study: p.field_of_study ?? '',
            year_of_study: p.year_of_study,
            skills: p.skills,
            interests: p.interests,
          }
        : EMPTY,
    )
  }

  useEffect(() => {
    getProfile()
      .then(show)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy('upload')
    setMessage(null)
    try {
      show(await uploadCv(file))
      setMessage({
        kind: 'ok',
        text: 'CV read! Check your profile below. Your "For you" list is being updated.',
      })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Upload failed.' })
    } finally {
      setBusy(null)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleSave() {
    setBusy('save')
    setMessage(null)
    try {
      show(await saveProfile({ ...form, field_of_study: form.field_of_study || null }))
      setMessage({ kind: 'ok', text: 'Profile saved. Your "For you" list is being updated.' })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Save failed.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your profile? Recommendations will stop until you add one again.'))
      return
    await deleteProfile()
    show(null)
    setMessage({ kind: 'ok', text: 'Profile deleted.' })
  }

  if (loading) {
    return <p className="p-10 text-center text-sm text-faint">Loading your profile…</p>
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-ink">Your profile</h1>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-semibold text-ink">Upload your CV</h2>
        <p className="mt-1 text-sm text-muted">
          PDF or Word, up to 5 MB. We read your field, skills and interests to recommend
          opportunities. The file itself is not kept.
        </p>
        {profile?.cv_filename && (
          <p className="mt-2 text-xs text-faint">Last read: {profile.cv_filename}</p>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => fileInput.current?.click()}
          className="btn-primary mt-3 w-full"
        >
          <UploadIcon className="h-5 w-5" />
          {busy === 'upload' ? 'Reading your CV…' : profile ? 'Upload a new CV' : 'Choose CV file'}
        </button>
      </section>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-xl p-3 text-sm ${
            message.kind === 'error' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="mt-4 space-y-4 rounded-2xl border border-line bg-surface p-4">
        <div>
          <h2 className="font-semibold text-ink">
            {profile ? 'Check and edit' : 'No CV? Fill it in yourself'}
          </h2>
          {profile?.summary && <p className="mt-1 text-sm text-muted">{profile.summary}</p>}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink-2">Field of study</span>
          <input
            value={form.field_of_study ?? ''}
            onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
            placeholder="e.g. Computer Science"
            className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-2">Year of study</span>
          <select
            value={form.year_of_study ?? ''}
            onChange={(e) =>
              setForm({ ...form, year_of_study: e.target.value ? Number(e.target.value) : null })
            }
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </label>

        <TagEditor
          label="Skills"
          values={form.skills}
          onChange={(skills) => setForm({ ...form, skills })}
          placeholder="e.g. Python"
        />
        <TagEditor
          label="Interests"
          values={form.interests}
          onChange={(interests) => setForm({ ...form, interests })}
          placeholder="e.g. Machine learning"
        />

        <button
          type="button"
          disabled={busy !== null}
          onClick={handleSave}
          className="btn-primary w-full"
        >
          {busy === 'save' ? 'Saving…' : 'Save profile'}
        </button>
        {profile && (
          <button type="button" onClick={handleDelete} className="btn-danger w-full">
            Delete profile
          </button>
        )}
      </section>
    </div>
  )
}
