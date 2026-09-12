// src/components/NavBar.jsx
import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, ClipboardList, Settings } from 'lucide-react'

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <Home size={22} />
        <span>Beranda</span>
      </NavLink>
      <NavLink to="/workout" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Dumbbell size={22} />
        <span>Latihan</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ClipboardList size={22} />
        <span>Riwayat</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings size={22} />
        <span>Pengaturan</span>
      </NavLink>
    </nav>
  )
}
