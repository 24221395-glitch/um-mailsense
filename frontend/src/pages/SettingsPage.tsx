import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAccount, getMe, signIn, signOut } from '../api/auth'
import { ApiError } from '../api/client'
import { BellIcon, GoogleLogo, LogoutIcon, ShieldIcon } from '../components/icons'
import ThemeToggle from '../components/ThemeToggle'
import type { User } from '../types/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/', { replace: true })
      })
  }, [navigate])

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteAccount()
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    await signOut().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted">Your account, appearance and privacy.</p>
      </header>

      <section className="card p-5">
        <h2 className="font-semibold text-ink">Account</h2>
        <p className="mt-1 text-sm text-muted">
          Signed in as <span className="font-medium text-ink">{user?.email}</span>
          {user?.role === 'admin' && (
            <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              Admin
            </span>
          )}
        </p>
        <ul className="mt-4 space-y-2">
          {user?.accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"
            >
              <span className="flex items-center gap-3 text-sm text-ink">
                <GoogleLogo className="h-5 w-5" />
                {a.email}
              </span>
              {a.needs_reconnect ? (
                <button type="button" onClick={() => signIn(a.provider)} className="btn-soft">
                  Reconnect
                </button>
              ) : (
                <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                  Connected · read-only
                </span>
              )}
            </li>
          ))}
        </ul>
        <button type="button" onClick={handleSignOut} className="btn-ghost mt-4 py-2.5 text-sm">
          <LogoutIcon className="h-4 w-4" /> Sign out
        </button>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold text-ink">Appearance</h2>
          <p className="mt-1 text-sm text-muted">Switch between the light and dark theme.</p>
        </div>
        <ThemeToggle />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <BellIcon className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <h2 className="font-semibold text-ink">Deadline reminders</h2>
            <p className="mt-1 text-sm text-muted">Choose which segments remind you.</p>
          </div>
        </div>
        <Link to="/calendar" className="btn-soft">
          Open reminders
        </Link>
      </section>

      <section className="card border-danger/30 p-5">
        <div className="flex items-start gap-3">
          <ShieldIcon className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <h2 className="font-semibold text-ink">Delete my account</h2>
            <p className="mt-1 text-sm text-muted">
              Removes your emails, CV profile, saved posts and sign-in tokens from MailSense. Your
              Siswamail itself is not touched.
            </p>
          </div>
        </div>
        {confirming ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-ghost py-2.5 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn-danger mt-4">
            Delete account
          </button>
        )}
      </section>
    </div>
  )
}
