import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Acasă', end: true },
  { to: '/calendar', label: 'Calendar' },
  { to: '/appointments', label: 'Programări' },
  { to: '/clients', label: 'Clienți' },
]

export default function Layout() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
        <Outlet />
      </main>

            <nav className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded-3xl border border-line bg-surface/90 p-2 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex-1 rounded-2xl py-3 text-center text-xs font-medium transition ${
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/30'
                    : 'text-muted hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}