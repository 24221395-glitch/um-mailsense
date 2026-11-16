import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, getProviders, signIn } from '../api/auth'
import type { Providers } from '../types/api'

const ERROR_MESSAGES: Record<string, string> = {
  admin_approval_required:
    'Your university has not approved MailSense for Siswamail yet. Please try again later, or sign in with Google for now.',
  access_denied:
    'Sign-in was cancelled. MailSense needs read-only access to your inbox to sort it.',
  gmail_permission_missing:
    'Please tick "Read your Gmail" on the Google screen. MailSense only reads, it never sends or deletes.',
  domain_not_allowed: 'Please sign in with your Siswamail (@siswa.um.edu.my) account.',
  session_expired: 'Sign-in took too long. Please try again.',
  invalid_state: 'Sign-in could not be verified. Please try again.',
  email_not_verified: 'Your Google email address is not verified.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [providers, setProviders] = useState<Providers>({ microsoft: true, google: true })
  const error = params.get('error')
  const [asClub, setAsClub] = useState(false)
  const next = asClub ? '/organisation' : undefined

  useEffect(() => {
    // Already signed in? Go straight to the inbox.
    getMe()
      .then(() => navigate('/inbox', { replace: true }))
      .catch(() => {})
    getProviders()
      .then(setProviders)
      .catch(() => {})
  }, [navigate])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-blue-700">MailSense</h1>
      <p className="mt-2 text-sm text-slate-500">Your university emails, sorted.</p>

      {error && (
        <p
          role="alert"
          className="mt-6 w-full max-w-xs rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.'}
        </p>
      )}

      <button
        type="button"
        onClick={() => signIn('microsoft', next)}
        disabled={!providers.microsoft}
        className="mt-8 w-full max-w-xs rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        Sign in with Siswamail
      </button>
      <button
        type="button"
        onClick={() => signIn('google', next)}
        disabled={!providers.google}
        className="mt-3 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
      >
        Sign in with Google
      </button>

      <p className="mt-4 max-w-xs text-center text-xs text-slate-400">
        Read-only access. We never see your password and never send or delete mail. You can
        disconnect at any time.
      </p>

      {asClub ? (
        <p className="mt-6 max-w-xs text-center text-sm text-slate-600">
          Sign in above with the account that will manage your club. You will then fill in a short
          application for an admin to verify.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setAsClub(true)}
          className="mt-6 text-sm text-blue-600"
        >
          Club or organisation? Register
        </button>
      )}
    </main>
  )
}
