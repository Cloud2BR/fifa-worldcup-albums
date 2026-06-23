import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`

function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">FIFA World Cup History Albums</h1>
        <nav className="flex gap-2">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/worldcups" className={linkClass}>
            World Cups
          </NavLink>
          <NavLink to="/albums" className={linkClass}>
            Albums
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
