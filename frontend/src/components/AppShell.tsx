import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getMe, signOut } from '../api/auth'
import { useDeadlineReminders } from '../hooks/useDeadlineReminders'
import type { User } from '../types/api'
import {
  BuildingIcon,
  CalendarIcon,
  FileIcon,
  HomeIcon,
  InboxIcon,
  Logo,
  LogoutIcon,
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

function initials(user: User | null): string {
  const source = user?.name || user?.email || '?'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/** Layout for signed-in pages: dark purple sidebar on desktop, top bar + tabs on phones. */
export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  useDeadlineReminders()

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  const items = ITEMS.filter((i) => !i.admin || user?.role === 'admin')
  const forYou = new URLSearchParams(location.search).get('segment') === 'FOR_YOU'

  function isActive(item: Item): boolean {
    const path = location.pathname
    if (item.to === '/inbox') return (path === '/inbox' && !forYou) || path.startsWith('/emails')
    if (item.to.includes('FOR_YOU')) return path === '/inbox' && forYou
    return path.startsWith(item.to)
  }

  async function handleSignOut() {
    await signOut().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-side p-4 text-side-ink lg:flex">
        <NavLink to="/home" className="mb-8 px-2 pt-2">
          <Logo light />
        </NavLink>
        <nav aria-label="Main" className="flex-1 space-y-1">
          {items.map((item) => {
            const active = isActive(item)
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active
                    ? 'bg-gradient-to-r from-accent-2 to-accent text-white shadow-[0_8px_20px_rgba(91,63,248,0.45)]'
                    : 'text-side-muted hover:bg-side-2 hover:text-white'
                }`}
              >
                <item.Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="flex items-center gap-3 rounded-2xl bg-side-2 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-2 to-accent text-sm font-semibold text-white">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-side-muted hover:bg-side hover:text-white"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* phone top bar */}
      <header className="sticky top-0 z-20 bg-side text-side-ink lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/home">
            <Logo light />
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-side-2 text-white"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {items.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                isActive(item)
                  ? 'bg-gradient-to-r from-accent-2 to-accent text-white'
                  : 'text-side-muted hover:bg-side-2 hover:text-white'
              }`}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
