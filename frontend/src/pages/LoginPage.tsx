import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, getProviders, signIn, signInDemo } from '../api/auth'
import {
  BankIcon,
  CalendarIcon,
  FileIcon,
  GoogleLogo,
  InboxIcon,
  Logo,
  LockIcon,
  MailIcon,
  MicrosoftLogo,
  SEGMENT_ICONS,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from '../components/icons'
import { Campus, Mascot } from '../components/Illustrations'
import ThemeToggle from '../components/ThemeToggle'
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

const YEAR = new Date().getFullYear()

const NAV = [
  ['Home', '#home'],
  ['Features', '#features'],
  ['How It Works', '#how'],
  ['For Organisations', '#organisations'],
  ['About', '#about'],
  ['FAQ', '#faq'],
]

const PREVIEW_TILES: [string, string, number][] = [
  ['UM_NOTICE', 'UM Notice', 12],
  ['HACKATHON', 'Hackathon', 5],
  ['RESEARCH', 'Research', 3],
  ['EVENT', 'Events', 8],
  ['SCHOLARSHIP_CAREER', 'Scholarships', 2],
  ['CLUB', 'Club & Community', 6],
]

const PREVIEW_MENU = [
  [InboxIcon, 'Inbox'],
  [StarIcon, 'For You'],
  [TrophyIcon, 'Opportunities'],
  [CalendarIcon, 'Calendar'],
  [FileIcon, 'My CV'],
] as const

const FEATURES = [
  [
    MailIcon,
    'AI Email Organisation',
    'Automatically categorise and summarise your Siswamail emails.',
  ],
  [
    TargetIcon,
    'Personalised Opportunities',
    'Get relevant hackathons, research, scholarships and events for you.',
  ],
  [
    FileIcon,
    'CV-Based Recommendation',
    'Upload your CV and receive opportunities that match your skills and interests.',
  ],
  [
    UsersIcon,
    'UM Community Board',
    'Explore programmes, calls and announcements from UM clubs and organisations.',
  ],
] as const

const STEPS = [
  [
    'Sign in with Siswamail',
    'Use your UM Microsoft 365 account. We never see your password, and access is read-only.',
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
    'Can I use it without a Siswamail account?',
    'Yes, you can sign in with Google to sort a Gmail inbox. Siswamail is recommended for UM notices.',
  ],
  [
    'How do I stop using it?',
    'Disconnect your mailbox or delete your account from your profile. All your data is removed.',
  ],
]

function SignInButton({
  next,
  disabled,
  className = '',
}: {
  next?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => signIn('microsoft', next)}
      className={`btn-primary ${className}`}
    >
      <MicrosoftLogo />
      Sign in with Siswamail
    </button>
  )
}

function InboxPreview() {
  return (
    <div className="card overflow-hidden bg-surface/90 backdrop-blur [transform:perspective(1400px)_rotateY(-10deg)_rotateX(3deg)]">
      <div className="flex gap-1.5 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#f2683a]" />
        <span className="h-3 w-3 rounded-full bg-accent-2" />
        <span className="h-3 w-3 rounded-full bg-faint" />
      </div>
      <div className="flex">
        <aside className="hidden w-40 shrink-0 space-y-1 border-r border-line p-3 text-sm sm:block">
          <p className="flex items-center gap-1.5 px-2 py-2 font-medium text-ink">
            <MailIcon className="h-3.5 w-3.5 text-accent" /> UM{' '}
            <span className="text-accent">MailSense</span>
          </p>
          {PREVIEW_MENU.map(([Ico, label], i) => (
            <p
              key={label}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                i === 0 ? 'bg-accent font-medium text-on-accent' : 'text-muted'
              }`}
            >
              <Ico className="h-3.5 w-3.5" /> {label}
            </p>
          ))}
        </aside>
        <div className="flex-1 p-4">
          <p className="mb-4 flex items-center gap-1.5 text-base font-medium text-ink">
            Your Inbox, Organised by AI <SparkleIcon className="h-3.5 w-3.5 text-accent" />
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PREVIEW_TILES.map(([code, label, n]) => {
              const Ico = SEGMENT_ICONS[code]
              return (
                <div
                  key={code}
                  className="rounded-xl border border-line bg-surface-2 px-2 py-4 text-center"
                >
                  <Ico className="mx-auto h-8 w-8 text-accent" />
                  <p className="mt-2 text-sm font-medium leading-tight text-ink">{label}</p>
                  <p className="mt-0.5 text-xs text-muted">{n} new</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ before, accent, id }: { before: string; accent: string; id?: string }) {
  return (
    <div id={id} className="mb-8 flex scroll-mt-24 items-center justify-center gap-6">
      <span className="hidden h-px w-24 bg-line-strong sm:block" />
      <h2 className="text-center text-3xl font-semibold text-ink sm:text-4xl">
        {before} <span className="text-gradient">{accent}</span>
      </h2>
      <span className="hidden h-px w-24 bg-line-strong sm:block" />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [providers, setProviders] = useState<Providers>({ microsoft: true, google: true })
  const error = params.get('error')

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
    <div className="overflow-x-hidden">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-transparent bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Logo />
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {NAV.map(([label, href], i) => (
              <a
                key={href}
                href={href}
                className={`rounded-full px-5 py-2.5 text-sm ${
                  i === 0 ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2 hover:text-accent'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignInButton
              disabled={!providers.microsoft}
              className="hidden px-4 py-2.5 text-sm sm:inline-flex"
            />
          </div>
        </div>
      </header>

      <main id="home">
        {/* hero */}
        <section className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 pb-12 pt-10 sm:px-8 lg:grid-cols-[minmax(0,37rem)_1fr] lg:pt-16">
          <div>
            <p className="eyebrow flex items-center gap-4">
              Universiti Malaya <span className="h-px w-8 bg-accent" />
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.15] text-ink sm:text-5xl lg:text-[3.2rem]">
              Your AI-Powered <br className="hidden sm:block" />
              Siswamail <span className="text-gradient">Companion</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              Organise your UM emails, discover opportunities, and get personalised recommendations
              — all in one smart platform.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-6 max-w-xl rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
              >
                {ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.'}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#features" className="btn-ghost">
                Learn More
              </a>
              <SignInButton disabled={!providers.microsoft} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {providers.google && (
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent"
                >
                  <GoogleLogo /> or continue with Google
                </button>
              )}
              {providers.demo && (
                <button
                  type="button"
                  onClick={signInDemo}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-2"
                >
                  <SparkleIcon className="h-4 w-4" /> Try the demo (sample data)
                </button>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-2">
              <li className="flex items-center gap-2">
                <ShieldIcon className="h-5 w-5 text-accent" /> Official Microsoft 365
              </li>
              <li className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden="true" />
              <li className="flex items-center gap-2">
                <LockIcon className="h-5 w-5 text-accent" /> PDPA Compliant
              </li>
              <li className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden="true" />
              <li className="flex items-center gap-2">
                <BankIcon className="h-5 w-5 text-accent" /> UM Approved
              </li>
            </ul>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl items-center lg:max-w-none">
            <Mascot className="pointer-events-none relative z-10 -mr-8 hidden w-[15rem] shrink-0 translate-y-6 drop-shadow-[0_20px_40px_rgba(247,147,30,0.25)] lg:block xl:w-[17rem]" />
            <div className="min-w-0 flex-1">
              <InboxPreview />
              <Mascot className="mx-auto mt-6 w-48 lg:hidden" />
            </div>
          </div>
        </section>

        {/* features */}
        <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8">
          <SectionTitle id="features" before="Everything for Your" accent="UM Journey" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([Ico, title, text]) => (
              <article key={title} className="card p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent">
                  <Ico className="h-8 w-8" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8">
          <SectionTitle id="how" before="How It" accent="Works" />
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-on-accent">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* organisations */}
        <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8">
          <SectionTitle id="organisations" before="For" accent="Organisations" />
          <div className="card grid items-center gap-6 p-8 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="text-xl font-semibold text-ink">Reach the right students</h3>
              <p className="mt-2 max-w-2xl text-ink-2">
                Verified UM clubs, societies and offices can post programmes on the community board.
                MailSense recommends each post to the students whose skills and interests match.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <SignInButton next="/organisation" disabled={!providers.microsoft} />
              {providers.google && (
                <button
                  type="button"
                  onClick={() => signIn('google', '/organisation')}
                  className="btn-ghost"
                >
                  <GoogleLogo /> Register with Google
                </button>
              )}
            </div>
          </div>
        </section>

        {/* about */}
        <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8">
          <SectionTitle id="about" before="About" accent="MailSense" />
          <div className="card mx-auto max-w-3xl p-8 text-center text-ink-2">
            <p className="leading-relaxed">
              UM MailSense is a student project at Universiti Malaya. Students told us important
              notices, deadlines and opportunities get buried in a busy Siswamail inbox. MailSense
              uses AI to sort every email, surface what matters to you, and bring UM clubs and
              students together in one place.
            </p>
            <p className="mt-4 text-sm text-muted">
              Read-only access · Encrypted storage · Your data deleted on request
            </p>
          </div>
        </section>

        {/* faq */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
          <SectionTitle id="faq" before="Frequently Asked" accent="Questions" />
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                  {q}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-8">
        <Campus className="mx-auto block w-full max-w-6xl" />
        <p className="border-t border-line py-6 text-center text-xs text-faint">
          © {YEAR} UM MailSense · A Universiti Malaya student project
        </p>
      </footer>
    </div>
  )
}
