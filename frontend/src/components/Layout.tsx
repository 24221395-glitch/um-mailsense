import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/inbox", label: "Inbox" },
  { to: "/ads", label: "Ad board" },
  { to: "/profile", label: "Profile" },
  { to: "/admin", label: "Admin" },
];

export default function Layout() {
  return (
    <div className="min-h-full">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="text-lg font-extrabold">
            UM <span className="text-gold">MailSense</span>
          </span>
          <nav className="flex gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-semibold ${isActive ? "bg-white/15" : "text-white/75 hover:text-white"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
