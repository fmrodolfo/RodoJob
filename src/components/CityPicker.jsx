import { useState, useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { geocodeCity } from '../lib/api'

// Selector de ciudades con autocompletado. Guarda objetos { name, lat, lon }.
export default function CityPicker({ cities, onChange, placeholder, country }) {
  const [q, setQ] = useState('')
  const [sug, setSug] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef()
  const box = useRef()

  useEffect(() => {
    if (q.trim().length < 2) { setSug([]); setLoading(false); return }
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try { const r = await geocodeCity(q.trim(), country); setSug(r); setOpen(true) }
      catch { setSug([]) }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(timer.current)
  }, [q, country])

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function add(item) {
    if (item?.name && !cities.some((c) => c.name === item.name)) {
      onChange([...cities, { name: item.name, lat: item.lat ?? null, lon: item.lon ?? null, aliases: item.aliases || [item.name] }])
    }
    setQ(''); setSug([]); setOpen(false)
  }
  function remove(nm) { onChange(cities.filter((c) => c.name !== nm)) }

  return (
    <div ref={box} style={{ position: 'relative' }}>
      {cities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {cities.map((c) => (
            <span key={c.name} className="chip active" style={{ cursor: 'default' }}>
              <MapPin size={13} /> {c.name}
              <X size={14} style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => remove(c.name)} />
            </span>
          ))}
        </div>
      )}

      <input
        className="input" value={q} placeholder={placeholder || 'Escribe una ciudad…'}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (sug.length) setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (sug[0]) add(sug[0]); else if (q.trim()) add({ name: q.trim() }) }
        }}
      />

      {open && (loading || sug.length > 0) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50,
          background: '#fff', border: '1px solid var(--border)', borderRadius: 13,
          boxShadow: 'var(--shadow)', overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
        }}>
          {loading && <div style={{ padding: '10px 14px', fontSize: 13 }} className="muted">Buscando ciudades…</div>}
          {!loading && sug.map((s, i) => (
            <div key={i} onClick={() => add(s)}
              style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', borderTop: i ? '1px solid var(--border)' : 'none' }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sky-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
              <MapPin size={15} style={{ color: 'var(--sky-600)', flex: 'none' }} />
              <span style={{ fontSize: 14, minWidth: 0 }}>
                <b>{s.name}</b>{' '}
                <span className="muted" style={{ fontSize: 12 }}>{s.label}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
