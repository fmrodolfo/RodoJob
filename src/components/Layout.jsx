import { NavLink, useNavigate } from 'react-router-dom'
import { Search, CheckCircle, Building2, User, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Layout({ children, onSwitchProfile }) {
  const { activeProfile } = useApp()
  const nav = useNavigate()

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="" />
          <span>Rodo<span className="job">Job</span></span>
        </div>
        <button onClick={onSwitchProfile} title="Cambiar perfil"
          style={{ background: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{activeProfile?.name}</span>
          {activeProfile?.photoURL
            ? <img src={activeProfile.photoURL} className="avatar-mini" alt="" />
            : <div className="avatar-mini placeholder">{activeProfile?.name?.[0]?.toUpperCase() || '?'}</div>}
        </button>
      </div>

      <div className="page">{children}</div>

      <nav className="nav">
        <NavLink to="/" end><Search size={21} /><span>Ofertas</span></NavLink>
        <NavLink to="/cartas"><Mail size={21} /><span>Cartas</span></NavLink>
        <NavLink to="/aplicadas"><CheckCircle size={21} /><span>Aplicadas</span></NavLink>
        <NavLink to="/empresas"><Building2 size={21} /><span>Empresas</span></NavLink>
        <NavLink to="/perfil"><User size={21} /><span>Perfil</span></NavLink>
      </nav>
    </div>
  )
}
