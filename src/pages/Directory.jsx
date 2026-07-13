import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { searchCompanies, SECTORS, COUNTRIES } from '../lib/api'
import { Search as SearchIcon, ExternalLink, Check, Sparkles, Building2, Mail, Globe } from 'lucide-react'
import CandidacyModal from '../components/CandidacyModal'
import CityPicker from '../components/CityPicker'

const compKey = (c) => (c.name + '|' + c.location).toLowerCase().replace(/\W/g, '')

export default function DirectoryPage() {
  const { contacts, addContact, deleteContact } = useApp()
  const [cities, setCities] = useState([])
  const [country, setCountry] = useState('ch')
  const [sector, setSector] = useState('restaurantes')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)
  const [adaptFor, setAdaptFor] = useState(null)

  const isContacted = (c) => contacts.some((x) => x.key === compKey(c))

  async function run() {
    setLoading(true); setErr(''); setSearched(true)
    try {
      if (!cities.length) { setErr('Elige al menos una ciudad de la lista.'); setLoading(false); return }
      const all = []
      const seen = new Set()
      for (const city of cities) {
        const data = await searchCompanies({ where: city, sector })
        for (const c of (data.results || [])) {
          const k = compKey(c)
          if (seen.has(k)) continue
          seen.add(k); all.push(c)
        }
      }
      setResults(all)
    } catch (e) {
      setErr(e.message || 'No se pudieron cargar las empresas.'); setResults([])
    } finally { setLoading(false) }
  }

  function toggleContacted(c) {
    if (isContacted(c)) {
      const existing = contacts.find((x) => x.key === compKey(c))
      if (existing) deleteContact(existing.id)
    } else {
      addContact({ key: compKey(c), name: c.name, sector: c.sector, location: c.location, website: c.website, email: c.email || '' })
    }
  }

  return (
    <div>
      <h1 className="page-title">Buscar empresas</h1>
      <p className="page-sub">La app te propone empresas reales por ciudad y sector. Entra en su web y envía tu candidatura; la IA te adapta el CV y la carta.</p>

      <div className="card">
        <div className="field">
          <label><Globe size={13} style={{ verticalAlign: -2 }} /> País</label>
          <select className="select" value={country} onChange={(e) => { setCountry(e.target.value); setCities([]) }}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>¿Dónde? Escribe y elige ciudades de la lista</label>
          <CityPicker cities={cities} onChange={setCities} country={country} placeholder="Ginebra, Lausana, Barcelona…" />
        </div>
        <div className="field">
          <label>Sector</label>
          <select className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
            {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <button className="btn block" onClick={run} disabled={loading}>
          {loading ? <span className="spinner" /> : <><SearchIcon size={18} /> Buscar empresas</>}
        </button>
      </div>

      {err && <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>{err}</div>}

      {searched && !loading && results.length === 0 && !err && (
        <div className="empty"><Building2 size={40} /><p>No encontré empresas para ese sector y ciudad. Prueba otra ciudad o sector.</p></div>
      )}
      {!searched && (
        <div className="empty"><Building2 size={40} /><p>Escribe una ciudad y elige un sector. La app te dará empresas reales para contactar.</p></div>
      )}

      <AnimatePresence>
        {results.map((c, i) => {
          const done = isContacted(c)
          return (
            <motion.div key={compKey(c)} className={`card job-item ${done ? 'done' : ''}`}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }} layout>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={17} /> {c.name}</h3>
                {done && <span className="badge applied">Contactada</span>}
              </div>
              <div className="job-meta">
                <span>{c.location}</span>
                {c.email && <span>· {c.email}</span>}
                {!c.hasWebsite && <span>· 🔎 buscar web</span>}
              </div>
              <div className="job-actions">
                <a className="btn sm" href={c.website} target="_blank" rel="noreferrer">Ver web y aplicar <ExternalLink size={15} /></a>
                {c.email && <a className="btn sm ghost" href={`mailto:${c.email}`}>Correo <Mail size={14} /></a>}
                <button className="btn sm ghost" onClick={() => setAdaptFor(c)}><Sparkles size={15} /> Adaptar CV / carta</button>
                <button className="btn sm ghost" onClick={() => toggleContacted(c)}>
                  <Check size={15} /> {done ? 'Contactada ✓' : 'Marcar contactada'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <AnimatePresence>
        {adaptFor && (
          <CandidacyModal
            job={{
              title: 'Candidatura espontánea', company: adaptFor.name, location: adaptFor.location,
              description: `Empresa del sector ${adaptFor.sector} en ${adaptFor.location}.`, redirect_url: adaptFor.website,
            }}
            companyMode
            onClose={() => setAdaptFor(null)}
            onApplied={() => { toggleContacted(adaptFor); setAdaptFor(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
