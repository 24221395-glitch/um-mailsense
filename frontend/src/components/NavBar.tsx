import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getMe } from '../api/auth'
import { useDeadlineReminders } from '../hooks/useDeadlineReminders'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

/** Top navigation shared by the signed-in pages. */
export default function NavBar() {
  const [isAdmin, setIsAdmin] = useState(false)
  useDeadlineReminders()

  useEffect(() => {
    getMe()
      .then((u) => setIsAdmin(u.role === 'admin'))
      .catch(() => {})
  }, [])

  return (
    <nav aria-label="Main" className="mb-4 flex gap-1 overflow-x-auto pb-1">
      <NavLink to="/inbox" className={linkClass}>
        Inbox
      </NavLink>
      <NavLink to="/segments" className={linkClass}>
        Segments
      </NavLink>
      <NavLink to="/calendar" className={linkClass}>
        Calendar
      </NavLink>
      <NavLink to="/board" className={linkClass}>
        Board
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        Profile
      </NavLink>
      <NavLink to="/organisation" className={linkClass}>
        My club
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkClass}>
          Admin
        </NavLink>
      )}
    </nav>
  )
}
