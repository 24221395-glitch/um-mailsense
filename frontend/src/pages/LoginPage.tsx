import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, getProviders, signIn, signInDemo } from '../api/auth'
import {
  CalendarIcon,
  CheckIcon,
  FileIcon,
  GoogleLogo,
  KeyShieldIcon,
  LockIcon,
  Logo,
  MailIcon,
  MegaphoneIcon,
  ShieldIcon,
  SparkleIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from '../components/icons'
import { Mascot } from '../components/Illustrations'
import type { Providers } from '../types/api'

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    'Sign-in was cancelled. MailSense needs read-only access to your inbox to sort it.',
  gmail_permission_missing:
    'Please tick "Read your Gmail" on the Google screen. MailSense only reads, it never sends or deletes.',
  domain_not_allowed: 'Please sign in with your Siswamail (@siswa.um.edu.my) account.',
  session_expired: 'Sign-in took too long. Please try again.',
  invalid_state: 'Sign-in could not be verified. Please try again.',
  email_not_verified: 'Your Google email address is not verified.',
  signin_unavailable:
    'Siswamail sign-in is being set up and will open very soon. Please check back shortly.',
}

const YEAR = new Date().getFullYear()

const NAV = [
  ['Features', '#features'],
  ['How It Works', '#how'],
  ['For Organisations', '#organisations'],
  ['Security', '#security'],
  ['FAQ', '#faq'],
]

const FEATURES = [
  [
    MailIcon,
    'AI Email Organisation',
    'Every Siswamail email sorted into clear segments automatically.',
  ],
  [
    TargetIcon,
    'Personalised Opportunities',
    'Hackathons, research, scholarships and events picked for you.',
  ],
  [
    FileIcon,
    'CV-Based Recommendation',
    'Upload your CV and see what matches your skills and interests.',
  ],
  [
    UsersIcon,
    'UM Community Board',
    'Programmes and calls from verified UM clubs and organisations.',
  ],
] as const

const STEPS = [
  [
    'Sign in with Siswamail',
    'Use your Siswamail (Google) account. We never see your password, and access is read-only.',
  ],
  [
    'AI sorts your inbox',
    'Every new email lands in the right segment, with deadlines, venues and links pulled out.',
  ],
  [
    'Get what fits you',
    'Upload your CV and MailSense highlights the opportunities that match your skills.',
  ],
]

const SECURITY_POINTS = [
  [
    LockIcon,
    'Read-only access',
    'MailSense can only read your inbox. It can never send, delete or change an email.',
  ],
  [
    ShieldIcon,
    'Encrypted storage',
    'Email content and sign-in tokens are encrypted in our database. Your password is never seen.',
  ],
  [
    KeyShieldIcon,
    'PDPA compliant',
    'Your data is used only to sort and recommend — never for advertising or sold to anyone.',
  ],
  [
    CheckIcon,
    'You stay in control',
    'Disconnect or delete your account at any time and all your data is removed.',
  ],
] as const

const FAQS = [
  [
    'Can MailSense send or delete my emails?',
    'No. MailSense asks for read-only access. It cannot send, delete or change anything in your mailbox.',
  ],
  [
    'Do you keep my CV?',
    'No. Your CV is read once to build your profile (field, skills, interests) and then discarded. You can edit or delete the profile at any time.',
  ],
  [
    'Who can see my emails?',
    'Only you. Email content is encrypted in our database and is used only to sort and recommend, never for advertising.',
  ],
  [
    'Which account do I sign in with?',
    'Your Siswamail account (@siswa.um.edu.my). MailSense uses Google sign-in, so your password stays with Google.',
  ],
  [
    'How do I stop using it?',
    'Open Settings and delete your account. Your emails, profile and sign-in tokens are removed.',
  ],
]

function SignInButton({
  next,
  ready,
  onNotReady,
  className = '',
}: {
  next?: string
  ready: boolean
  onNotReady: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => (ready ? signIn('google', next) : onNotReady())}
      className={`btn-primary ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
        <GoogleLogo className="h-4 w-4" />
      </span>
      Sign in with Siswamail
    </button>
  )
}

function FloatCard({
  Icon,
  color,
  title,
  sub,
  className = '',
}: {
  Icon: typeof TrophyIcon
  color: string
  title: string
  sub: string
  className?: string
}) {
  return (
    <div className={`card absolute flex items-center gap-3 px-4 py-3 backdrop-blur ${className}`}>
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${color}1f`, color }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs font-medium" style={{ color }}>
          {sub}
        </p>
      </div>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[28rem] w-full max-w-xl" aria-hidden="true">
      {/* glow + orbit */}
      <div className="absolute inset-x-6 top-10 bottom-6 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.28),transparent_65%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-[30rem] max-w-full -translate-x-1/2 -translate-y-1/3 -rotate-12 rounded-[50%] border-2 border-accent/20" />
      {/* mail app icon */}
      <div className="animate-float absolute left-[46%] top-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5aa7ff] to-[#3b6cf6] text-white shadow-lg">
        <MailIcon className="h-9 w-9" />
      </div>
      <Mascot className="absolute -right-2 top-4 w-64 sm:w-80" />
      <FloatCard
        Icon={TrophyIcon}
        color="#7c5cff"
        title="Hackathon"
        sub="3 new"
        className="left-0 top-20"
      />
      <FloatCard
        Icon={MegaphoneIcon}
        color="#f59e0b"
        title="UM Notice"
        sub="2 new"
        className="left-4 top-44"
      />
      <FloatCard
        Icon={CalendarIcon}
        color="#a855f7"
        title="Events"
        sub="5 new"
        className="left-24 bottom-6"
      />
      <FloatCard
        Icon={KeyShieldIcon}
        color="#0ea5a4"
        title="Security"
        sub="1 new"
        className="right-0 bottom-16 hidden sm:flex"
      />
    </div>
  )
}

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) {
  return (
    <div id={id} className="mb-10 scroll-mt-24 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [providers, setProviders] = useState<Providers>({ microsoft: false, google: true })
  const error = params.get('error')
  const [notReady, setNotReady] = useState(false)
  const showNotReady = () => setNotReady(true)

  useEffect(() => {
    // Already signed in? Go straight to the app.
    getMe()
      .then(() => navigate('/home', { replace: true }))
      .catch(() => {})
    getProviders()
      .then(setProviders)
      .catch(() => {})
  }, [navigate])

  return (
    <div className="overflow-x-hidden">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Logo />
          <nav aria-label="Sections" className="hidden items-center gap-8 lg:flex">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-ink-2 hover:text-accent"
              >
                {label}
              </a>
            ))}
          </nav>
          <SignInButton
            ready={providers.google}
            onNotReady={showNotReady}
            className="hidden px-4 py-2.5 text-sm sm:inline-flex"
          />
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-2 lg:pt-20">
          <div>
            <span className="pill">For Universiti Malaya Students</span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl wide:text-[3.6rem]">
              Turn Your Siswamail into Opportunities
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              An AI-powered email organiser that sorts your UM emails, highlights what matters, and
              recommends opportunities tailored to your skills and interests.
            </p>

            {(error || notReady) && (
              <p
                role="alert"
                className="mt-6 max-w-xl rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
              >
                {error
                  ? (ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.')
                  : ERROR_MESSAGES.signin_unavailable}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <SignInButton
                ready={providers.google}
                onNotReady={showNotReady}
                className="px-6 py-3.5"
              />
              <a href="#features" className="btn-ghost px-6 py-3">
                Learn More
              </a>
            </div>
            {providers.demo && (
              <button type="button" onClick={signInDemo} className="btn-soft mt-4">
                <SparkleIcon className="h-4 w-4" /> Try the demo (sample data)
              </button>
            )}

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-2">
              {['Secure Google sign-in', 'PDPA Compliant', 'UM Approved'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-accent" strokeWidth={2.6} /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </section>

        {/* features */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <SectionTitle id="features" eyebrow="Features" title="Everything for your UM journey" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([Ico, title, text]) => (
              <article key={title} className="card card-hover p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Ico className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <SectionTitle id="how" eyebrow="How it works" title="Three steps to a calmer inbox" />
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-2 to-accent font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* organisations */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <SectionTitle
            id="organisations"
            eyebrow="For organisations"
            title="Reach the right students"
          />
          <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-accent-2 to-accent p-8 text-white shadow-xl md:grid-cols-[1fr_auto] md:p-10">
            <p className="max-w-2xl text-lg leading-relaxed text-white/90">
              Verified UM clubs, societies and offices can post programmes on the community board.
              MailSense recommends each post to the students whose skills and interests match.
            </p>
            <button
              type="button"
              onClick={() =>
                providers.google ? signIn('google', '/organisation') : showNotReady()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-accent shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
            >
              Register your club
            </button>
          </div>
        </section>

        {/* security */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <SectionTitle id="security" eyebrow="Security & privacy" title="Your inbox stays yours" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY_POINTS.map(([Ico, title, text]) => (
              <article key={title} className="card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-soft text-success">
                  <Ico className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* faq */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
          <SectionTitle id="faq" eyebrow="FAQ" title="Frequently asked questions" />
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="card group p-5">
                <summary className="flex list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-8">
          <Logo />
          <p className="text-xs text-faint">
            © {YEAR} UM MailSense · A Universiti Malaya student project
          </p>
        </div>
      </footer>
    </div>
  )
}
