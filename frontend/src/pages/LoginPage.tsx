import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-blue-700">MailSense</h1>
      <p className="mt-2 text-sm text-slate-500">Your university emails, sorted.</p>
      <button
        type="button"
        onClick={() => navigate('/inbox')}
        className="mt-8 w-full max-w-xs rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
      >
        Sign in with Siswamail
      </button>
      <button type="button" className="mt-4 text-sm text-blue-600">
        Club or organisation? Register
      </button>
    </main>
  )
}