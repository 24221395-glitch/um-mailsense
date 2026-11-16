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
  InboxIcon,
  Logo,
  LogoutIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from './icons'
import { Campus } from './Illustrations'
import ThemeToggle from './ThemeToggle'

type Item = { to: string; label: string; Icon: typeof InboxIcon; admin?: boolean }

const ITEMS: Item[] = [
  { to: '/inbox', label: 'Inbox', Icon: InboxIcon },
  { to: '/inbox?segment=FOR_YOU', label: 'For You', Icon: StarIcon },
  { to: '/board', label: 'Opportunities', Icon: TrophyIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/profile', label: 'My CV', Icon: FileIcon },
  { to: '/segments', label: 'Segments', Icon: GridIcon },
  { to: '/organisation', label: 'My Club', Icon: BuildingIcon },
  { to: '/admin', label: 'Admin', Icon: ShieldIcon, admin: true },
]

/** Layout for signed-in pages: sidebar on desktop, top bar + tabs on phones. */
export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  useDeadlineReminders()

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {})
  }, [])

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

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      active
        ? 'bg-accent font-medium text-on-accent shadow-[0_6px_20px_rgba(247,147,30,0.25)]'
        : 'text-muted hover:bg-surface-2 hover:text-ink'
    }`

  return (
    <div className="min-h-screen lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
        <NavLink to="/inbox" className="mb-6 px-1 pt-1">
          <Logo />
        </NavLink>
        <nav aria-label="Main" className="flex-1 space-y-1">
          {items.map((item) => (
            <NavLink key={item.label} to={item.to} className={() => linkClass(isActive(item))}>
              <item.Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-line pt-4">
          {user && (
            <p className="truncate px-1 text-xs text-faint" title={user.email}>
              {user.email}
            </p>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm text-muted hover:border-line-strong hover:text-ink"
            >
              <LogoutIcon className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* phone top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/inbox">
            <Logo />
          </NavLink>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {items.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={() => `${linkClass(isActive(item))} shrink-0 py-2`}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-8 lg:py-10">
          <Outlet />
        </main>
        <Campus className="pointer-events-none mx-auto mt-10 block w-full max-w-4xl opacity-70" />
      </div>
    </div>
  )
}
