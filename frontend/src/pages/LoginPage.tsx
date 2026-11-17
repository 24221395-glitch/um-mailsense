import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMe, getProviders, signIn, signInDemo } from '../api/auth'
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  FileIcon,
  GoogleLogo,
  HomeIcon,
  InboxIcon,
  KeyShieldIcon,
  LockIcon,
  Logo,
  MailIcon,
  MegaphoneIcon,
  MenuIcon,
  SEGMENT_ICONS,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from '../components/icons'
import { Mascot } from '../components/Illustrations'
import ScaledStage from '../components/ScaledStage'
import { SEGMENT_COLORS, segmentLabel } from '../segments'
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

const STATS = [
  ['8', 'smart segments'],
  ['95.8%', 'AI sorting accuracy*'],
  ['100%', 'read-only access'],
  ['Free', 'for UM students'],
]

const FEATURES = [
  [
    MailIcon,
    '#5b3ff8',
    'AI Email Organisation',
    'Every Siswamail email is sorted into clear segments the moment it arrives.',
  ],
  [
    TargetIcon,
    '#f0436b',
    'Personalised Opportunities',
    'Hackathons, research posts, scholarships and events picked for you.',
  ],
  [
    FileIcon,
    '#10b981',
    'CV-Based Recommendation',
    'Upload your CV once and see which opportunities match your skills.',
  ],
  [
    UsersIcon,
    '#f59e0b',
    'UM Community Board',
    'Programmes and calls from verified UM clubs and organisations.',
  ],
  [
    CalendarIcon,
    '#3b82f6',
    'Deadline Calendar',
    'Deadlines are pulled out of emails and you get a reminder before they pass.',
  ],
  [
    KeyShieldIcon,
    '#0ea5a4',
    'Security Inbox',
    'Sign-in codes and login alerts in one place, phishing kept out of the way.',
  ],
] as const

const STEPS = [
  [
    'Sign in with Siswamail',
    'Use your Siswamail (Google) account. Your password stays with Google and access is read-only.',
  ],
  [
    'AI sorts your inbox',
    'Llama 4 reads each new email once and files it, pulling out deadlines, venues and links.',
  ],
  [
    'Get what fits you',
    'Add your CV and MailSense highlights the opportunities that match your skills and interests.',
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
    'Email content and sign-in tokens are encrypted in our database.',
  ],
  [
    KeyShieldIcon,
    'PDPA compliant',
    'Your data is used only to sort and recommend, never sold or used for ads.',
  ],
  [CheckIcon, 'You stay in control', 'Delete your account at any time and everything is removed.'],
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
  label = 'Sign in with Siswamail',
}: {
  next?: string
  ready: boolean
  onNotReady: () => void
  className?: string
  label?: string
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
      {label}
    </button>
  )
}

/** Glassy floating segment card with a glowing gradient icon (hero decoration). */
function FloatCard({
  Icon,
  from,
  to,
  title,
  sub,
  delay = '0s',
  className = '',
}: {
  Icon: typeof TrophyIcon
  from: string
  to: string
  title: string
  sub: string
  delay?: string
  className?: string
}) {
  return (
    <div className={`animate-float absolute ${className}`} style={{ animationDelay: delay }}>
      {/* coloured halo behind the card */}
      <div
        className="absolute -inset-3 rounded-[1.75rem] opacity-60 blur-2xl"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      />
      <div
        className="relative flex items-center gap-3 rounded-2xl border bg-white/85 py-3 pl-3 pr-5 backdrop-blur-xl"
        style={{
          borderColor: `${to}40`,
          boxShadow: `0 14px 34px ${to}33, inset 0 1px 0 rgba(255,255,255,0.9)`,
        }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            boxShadow: `0 8px 18px ${to}66, inset 0 1px 0 rgba(255,255,255,0.45)`,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={2.1} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#17123a]">{title}</p>
          <p
            className="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${to}1c`, color: to }}
          >
            {sub}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Robot + floating segment cards, designed on a 560x480 canvas and scaled as one piece to
 * the available width, so the composition fits identically on phones, tablets and desktops.
 */
function HeroVisual() {
  return (
    <div id="hero-visual" className="w-full">
      <ScaledStage width={560} height={480} className="mx-auto max-w-[40rem]">
        <div aria-hidden="true" className="absolute inset-0">
          {/* soft light behind the robot + two orbit rings */}
          <div className="absolute left-[90px] top-[40px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.30),rgba(124,92,255,0.08)_45%,transparent_70%)]" />
          <div className="absolute left-[10px] top-[170px] h-[230px] w-[540px] -rotate-[14deg] rounded-[50%] border-2 border-accent/20" />
          <div className="absolute left-[-20px] top-[140px] h-[290px] w-[600px] -rotate-[14deg] rounded-[50%] border border-accent/10" />
          <SparkleIcon className="absolute left-[500px] top-[40px] h-6 w-6 text-accent/50" />
          <SparkleIcon className="absolute left-[150px] top-[370px] h-4 w-4 text-accent/40" />

          {/* mail app tile */}
          <div
            className="animate-float absolute left-[212px] top-[4px]"
            style={{ animationDelay: '1.2s' }}
          >
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#60a5fa] to-[#6366f1] opacity-50 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60a5fa] to-[#4f46e5] text-white shadow-[0_14px_30px_rgba(79,70,229,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]">
              <MailIcon className="h-9 w-9" strokeWidth={2} />
            </div>
          </div>

          <Mascot className="absolute left-[200px] top-[44px] w-[330px]" />

          <FloatCard
            Icon={TrophyIcon}
            from="#a78bfa"
            to="#6d4aff"
            delay="0s"
            title="Hackathon"
            sub="3 new"
            className="left-[8px] top-[104px]"
          />
          <FloatCard
            Icon={MegaphoneIcon}
            from="#fcd34d"
            to="#f59e0b"
            delay="1.5s"
            title="UM Notice"
            sub="2 new"
            className="left-[0px] top-[222px]"
          />
          <FloatCard
            Icon={CalendarIcon}
            from="#f472b6"
            to="#a855f7"
            delay="3s"
            title="Events"
            sub="5 new"
            className="left-[70px] top-[360px]"
          />
          <FloatCard
            Icon={KeyShieldIcon}
            from="#5eead4"
            to="#0ea5a4"
            delay="2.2s"
            title="Security"
            sub="1 new"
            className="left-[392px] top-[352px]"
          />
        </div>
      </ScaledStage>
    </div>
  )
}

/** A static, scaled-down picture of the real Home dashboard. */
function ProductPreview() {
  const tiles = ['UM_NOTICE', 'HACKATHON', 'RESEARCH', 'EVENT', 'SCHOLARSHIP_CAREER', 'SECURITY']
  const counts = [6, 5, 4, 7, 3, 1]
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_80px_rgba(60,40,160,0.18)]">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
        <span className="h-3 w-3 rounded-full bg-[#ffc94d]" />
        <span className="h-3 w-3 rounded-full bg-[#4fd18b]" />
        <span className="ml-3 rounded-md bg-surface px-3 py-1 text-xs text-faint">
          um-mailsense.vercel.app/home
        </span>
      </div>
      <div className="flex">
        <aside className="hidden w-56 shrink-0 space-y-1 bg-side p-4 text-sm md:block">
          <Logo light className="mb-5 scale-90 origin-left" />
          {[
            [HomeIcon, 'Home'],
            [InboxIcon, 'Inbox'],
            [TrophyIcon, 'Opportunities'],
            [CalendarIcon, 'Calendar'],
            [FileIcon, 'My CV'],
          ].map(([Ico, label], i) => {
            const I = Ico as typeof HomeIcon
            return (
              <p
                key={label as string}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                  i === 0
                    ? 'bg-gradient-to-r from-accent-2 to-accent text-white'
                    : 'text-side-muted'
                }`}
              >
                <I className="h-4 w-4" /> {label as string}
              </p>
            )
          })}
        </aside>
        <div className="min-w-0 flex-1 space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-ink">Good morning, Aina 👋</p>
              <p className="text-xs text-muted">Here&apos;s your UM mail at a glance.</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2">
              <BellIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [MailIcon, '#5b3ff8', '42', 'Total Emails'],
              [SparkleIcon, '#7c5cff', '31', 'AI Sorted'],
              [CalendarIcon, '#f0436b', '5', 'Deadlines'],
              [StarIcon, '#f59e0b', '8', 'Recommended'],
            ].map(([Ico, color, n, label]) => {
              const I = Ico as typeof MailIcon
              return (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-xl border border-line p-3"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${color as string}1a`, color: color as string }}
                  >
                    <I className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">{n as string}</p>
                    <p className="text-[11px] text-muted">{label as string}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-2 to-accent px-5 py-4 text-white">
            <p className="font-semibold">AI has organised your inbox</p>
            <p className="text-xs text-white/80">Your emails are classified and prioritised.</p>
            <Mascot waving={false} className="absolute -bottom-8 right-3 w-24" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {tiles.map((code, i) => {
              const Ico = SEGMENT_ICONS[code]
              const c = SEGMENT_COLORS[code]!
              return (
                <div key={code} className="rounded-xl border border-line p-2 text-center">
                  <span
                    className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    <Ico className="h-4 w-4" />
                  </span>
                  <p className="mt-1 truncate text-[11px] font-semibold text-ink">
                    {segmentLabel(code)}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: c.fg }}>
                    {counts[i]} new
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  sub,
  id,
}: {
  eyebrow: string
  title: string
  sub?: string
  id?: string
}) {
  return (
    <div id={id} className="mx-auto mb-12 max-w-2xl scroll-mt-24 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [providers, setProviders] = useState<Providers>({ microsoft: false, google: true })
  const error = params.get('error')
  const [notReady, setNotReady] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const showNotReady = () => {
    setNotReady(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-lg">
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
          <div className="flex items-center gap-2">
            <SignInButton
              ready={providers.google}
              onNotReady={showNotReady}
              className="hidden px-4 py-2.5 text-sm sm:inline-flex"
            />
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={navOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-sm hover:border-accent hover:text-accent lg:hidden"
            >
              {navOpen ? (
                <span className="text-2xl leading-none">×</span>
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* phone / tablet section menu */}
        {navOpen && (
          <nav
            aria-label="Sections"
            className="border-t border-line bg-surface px-4 pb-5 pt-2 shadow-lg lg:hidden"
          >
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium text-ink hover:bg-accent-soft hover:text-accent"
              >
                {label}
                <ArrowRightIcon className="h-4 w-4 text-faint" />
              </a>
            ))}
            <SignInButton
              ready={providers.google}
              onNotReady={() => {
                setNavOpen(false)
                showNotReady()
              }}
              className="mt-3 w-full py-3.5"
            />
          </nav>
        )}
      </header>

      <main>
        {/* hero */}
        <section className="relative">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.35),transparent_65%)]" />
          <div className="pointer-events-none absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.12),transparent_65%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-12 sm:px-8 lg:grid-cols-2 lg:pt-16">
            <div>
              <span className="pill">
                <SparkleIcon className="mr-2 h-4 w-4" /> For Universiti Malaya Students
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl xl:text-[3.25rem] wide:text-[3.6rem]">
                Turn Your Siswamail <br className="hidden sm:block" />
                into Opportunities
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
                An AI-powered email organiser that sorts your UM emails, highlights what matters,
                and recommends opportunities tailored to your skills and interests.
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
                  className="px-6 py-3.5 text-base"
                />
                <a href="#preview" className="btn-ghost px-6 py-3 text-base">
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
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* stats strip */}
        <section className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="card grid grid-cols-2 divide-line p-2 sm:grid-cols-4 sm:divide-x">
            {STATS.map(([value, label]) => (
              <div key={label} className="px-4 py-5 text-center">
                <p className="text-gradient text-3xl font-bold">{value}</p>
                <p className="mt-1 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-faint">
            *Llama 4 Scout on our labelled sample of UM emails.
          </p>
        </section>

        {/* product preview */}
        <section id="preview" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-8">
          <SectionTitle
            eyebrow="See it in action"
            title="Your whole UM inbox, at a glance"
            sub="MailSense turns a busy Siswamail inbox into a calm dashboard of what matters to you."
          />
          <ProductPreview />
        </section>

        {/* features */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <SectionTitle id="features" eyebrow="Features" title="Everything for your UM journey" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([Ico, color, title, text]) => (
              <article key={title} className="card card-hover p-7">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: `${color}17`, color }}
                >
                  <Ico className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <SectionTitle id="how" eyebrow="How it works" title="Three steps to a calmer inbox" />
          <ol className="relative grid gap-6 md:grid-cols-3">
            <span className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-accent/30 md:block" />
            {STEPS.map(([title, text], i) => (
              <li key={title} className="relative text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-2 to-accent text-xl font-bold text-white shadow-[0_10px_24px_rgba(91,63,248,0.35)]">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* organisations */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <div
            id="organisations"
            className="relative grid scroll-mt-24 items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#8b6dff] via-accent to-[#4329d9] p-8 text-white shadow-[0_30px_70px_rgba(91,63,248,0.35)] md:grid-cols-[1fr_auto] md:p-12"
          >
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                For organisations
              </p>
              <h2 className="mt-3 text-3xl font-bold">Reach the right students</h2>
              <p className="mt-3 leading-relaxed text-white/85">
                Verified UM clubs, societies and offices post programmes on the community board, and
                MailSense recommends each post to the students whose skills and interests match.
              </p>
              <button
                type="button"
                onClick={() =>
                  providers.google ? signIn('google', '/organisation') : showNotReady()
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-accent shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
              >
                Register your club <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
            <Mascot className="relative z-10 mx-auto w-48 md:w-60" />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/5" />
          </div>
        </section>

        {/* security */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <div
            id="security"
            className="scroll-mt-24 overflow-hidden rounded-[2rem] bg-side p-8 text-white md:p-12"
          >
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-side-muted">
                Security &amp; privacy
              </p>
              <h2 className="mt-3 text-3xl font-bold">Your inbox stays yours</h2>
              <p className="mt-3 text-side-muted">
                MailSense is built for privacy first, in line with Malaysia&apos;s Personal Data
                Protection Act 2010.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SECURITY_POINTS.map(([Ico, title, text]) => (
                <article key={title} className="rounded-2xl bg-side-2 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#7ee8c8]">
                    <Ico className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-side-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
          <SectionTitle id="faq" eyebrow="FAQ" title="Frequently asked questions" />
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="card group p-5 open:ring-2 open:ring-accent/30">
                <summary className="flex list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg text-accent transition group-open:rotate-45 group-open:bg-accent group-open:text-white">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* final call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
          <div className="card flex flex-col items-center gap-6 p-10 text-center md:flex-row md:text-left">
            <Mascot waving={false} className="w-28 shrink-0" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-ink">Ready for a calmer Siswamail?</h2>
              <p className="mt-1 text-muted">Sign in once and let MailSense sort the rest.</p>
            </div>
            <SignInButton
              ready={providers.google}
              onNotReady={showNotReady}
              className="px-6 py-3.5"
              label="Get started"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted">
              An AI-powered Siswamail organiser and opportunity recommender for Universiti Malaya
              students.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {NAV.slice(0, 3).map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="hover:text-accent">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Trust</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href="#security" className="hover:text-accent">
                  Security &amp; privacy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-accent">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="border-t border-line py-5 text-center text-xs text-faint">
          © {YEAR} UM MailSense · A Universiti Malaya student project
        </p>
      </footer>
    </div>
  )
}
