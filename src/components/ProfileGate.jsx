import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { Plus, Camera, Check } from 'lucide-react'

// Pantalla de selección de perfiles (independientes) tras la intro.
export default function ProfileGate({ onEnter }) {
  const { profiles, setActiveId, createProfile } = useApp()
  const [creating, setCreating] = useState(profiles.length === 0)
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  function pick(e) {
    const f = e.target.files?.[0]
    if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)) }
  }

  async function create() {
    if (!name.trim()) return
    setBusy(true)
    await createProfile(name.trim(), photo)
    setBusy(false)
    onEnter()
  }

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="center" style={{ marginBottom: 24 }}>
          <img src="/logo.svg" width="44" height="44" alt="" />
          <h1 className="page-title" style={{ marginTop: 8 }}>Elige un perfil</h1>
          <p className="page-sub">Cada perfil es independiente. Puedes crear uno para ti y otro para un familiar.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, maxWidth: 440, margin: '0 auto' }}>
          {profiles.map((p) => (
            <motion.button key={p.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setActiveId(p.id); onEnter() }}
              className="card" style={{ width: 132, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {p.photoURL
                ? <img src={p.photoURL} className="avatar-mini" style={{ width: 66, height: 66 }} alt="" />
                : <div className="avatar-mini placeholder" style={{ width: 66, height: 66, fontSize: 24 }}>
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>}
              <b style={{ fontSize: 14 }}>{p.name}</b>
            </motion.button>
          ))}

          <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}
            onClick={() => setCreating(true)}
            className="card" style={{ width: 132, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', borderStyle: 'dashed' }}>
            <div className="avatar-mini placeholder" style={{ width: 66, height: 66 }}>
              <Plus size={26} />
            </div>
            <b style={{ fontSize: 14 }}>Nuevo</b>
          </motion.button>
        </div>

        {creating && (
          <motion.div className="card" style={{ marginTop: 22 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 14 }}>Crear perfil</h3>
            <div className="center" style={{ marginBottom: 14 }}>
              <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                {preview
                  ? <img src={preview} className="avatar-mini" style={{ width: 84, height: 84 }} alt="" />
                  : <div className="avatar-mini placeholder" style={{ width: 84, height: 84 }}><Camera size={26} /></div>}
                <input type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
              </label>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Toca para añadir foto</p>
            </div>
            <div className="field">
              <label>Nombre del perfil</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="p. ej. Rodolfo o Mi hermano" />
            </div>
            <button className="btn block" onClick={create} disabled={busy || !name.trim()}>
              {busy ? <span className="spinner" /> : <><Check size={18} /> Crear y entrar</>}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
