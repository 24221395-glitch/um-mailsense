import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getMe, signOut } from '../api/auth'
import { useDeadlineReminders } from '../hooks/useDeadlineReminders'
import type { User } from '../types/api'
import {
  BuildingIcon,
  CalendarIcon,
  FileIcon,
  GridIcon,
  HomeIcon,
  InboxIcon,
  Logo,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from './icons'

type Item = { to: string; label: string; Icon: typeof InboxIcon; admin?: boolean }

const ITEMS: Item[] = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/inbox', label: 'Inbox', Icon: InboxIcon },
  { to: '/inbox?segment=FOR_YOU', label: 'For You', Icon: StarIcon },
  { to: '/board', label: 'Opportunities', Icon: TrophyIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/profile', label: 'My CV', Icon: FileIcon },
  { to: '/organisation', label: 'My Club', Icon: BuildingIcon },
  { to: '/admin', label: 'Admin', Icon: ShieldIcon, admin: true },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

/** The four destinations in the phone/tablet bottom bar (the rest live under "More"). */
const BOTTOM = ['/home', '/inbox', '/board', '/calendar']

function initials(user: User | null): string {
  const source = user?.name || user?.email || '?'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

function Avatar({ user, size = 'h-10 w-10' }: { user: User | null; size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-2 to-accent text-sm font-semibold text-white`}
    >
      {initials(user)}
    </span>
  )
}

/**
 * Layout for signed-in pages, adapted to every screen size:
 * - large screens (≥1280px): full dark sidebar with labels and the user card
 * - laptops / tablet landscape (1024–1279px): slim icon sidebar
 * - phones / tablet portrait (<1024px): top bar + bottom tab bar + slide-in "More" menu
 */
export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useDeadlineReminders()

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  // close the drawer whenever the page changes
  const routeKey = location.pathname + location.search
  const [lastRoute, setLastRoute] = useState(routeKey)
  if (routeKey !== lastRoute) {
    setLastRoute(routeKey)
    setMenuOpen(false)
  }

  // Escape closes the drawer; the page behind does not scroll while it is open
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const items = ITEMS.filter((i) => !i.admin || user?.role === 'admin')
  const forYou = new URLSearchParams(location.search).get('segment') === 'FOR_YOU'

  function isActive(item: Item): boolean {
    const path = location.pathname
    if (item.to === '/inbox') return (path === '/inbox' && !forYou) || path.startsWith('/emails')
    if (item.to.includes('FOR_YOU')) return path === '/inbox' && forYou
    return path.startsWith(item.to)
  }

  const bottomItems = items.filter((i) => BOTTOM.includes(i.to))
  const moreActive = items.some((i) => !BOTTOM.includes(i.to) && isActive(i))

  async function handleSignOut() {
    await signOut().catch(() => {})
    navigate('/', { replace: true })
  }

  const activeLink =
    'bg-gradient-to-r from-accent-2 to-accent text-white shadow-[0_8px_20px_rgba(91,63,248,0.45)]'
  const idleLink = 'text-side-muted hover:bg-side-2 hover:text-white'

  return (
    <div className="min-h-screen lg:flex">
      {/* ---- sidebar: slim on laptops, full on large screens ---- */}
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col bg-side p-3 text-side-ink lg:flex xl:w-64 xl:p-4">
        <NavLink
          to="/home"
          className="mb-8 flex justify-center px-1 pt-2 xl:justify-start xl:px-2"
          aria-label="UM MailSense home"
        >
          <span className="xl:hidden">
            <Logo light className="[&>span:last-child]:hidden" />
          </span>
          <span className="hidden xl:inline">
            <Logo light />
          </span>
        </NavLink>
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              title={item.label}
              className={`flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium xl:justify-start xl:py-2.5 ${
                isActive(item) ? activeLink : idleLink
              }`}
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              <span className="hidden xl:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-side-2 p-2 xl:flex-row xl:p-3">
          <Avatar user={user} />
          <div className="hidden min-w-0 flex-1 xl:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name || 'Student'}</p>
            <p className="truncate text-xs text-side-muted" title={user?.email}>
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-side-muted hover:bg-side hover:text-white"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ---- phone / tablet top bar ---- */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-side px-4 py-3 text-side-ink shadow-md lg:hidden">
        <NavLink to="/home" aria-label="UM MailSense home">
          <Logo light />
        </NavLink>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-full bg-side-2 py-1 pl-1 pr-3 text-white"
        >
          <Avatar user={user} size="h-8 w-8" />
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      {/* ---- phone / tablet bottom tab bar ---- */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(60,40,160,0.08)] backdrop-blur-lg lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {bottomItems.map((item) => {
            const active = isActive(item)
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  active ? 'text-accent' : 'text-muted hover:text-accent'
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full ${
                    active ? 'bg-accent-soft' : ''
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                </span>
                {item.label === 'Opportunities' ? 'Board' : item.label}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
              moreActive ? 'text-accent' : 'text-muted hover:text-accent'
            }`}
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full ${
                moreActive ? 'bg-accent-soft' : ''
              }`}
            >
              <GridIcon className="h-5 w-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      {/* ---- slide-in menu (phones / tablets) ---- */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-[#17123a]/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-side p-4 text-side-ink shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo light />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-side-2 text-xl text-white"
              >
                ×
              </button>
            </div>
            <nav aria-label="All pages" className="flex-1 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium ${
                    isActive(item) ? activeLink : idleLink
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-side-2 p-3">
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || 'Student'}
                </p>
                <p className="truncate text-xs text-side-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-side-muted hover:bg-side hover:text-white"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
