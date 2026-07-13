import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { searchJobs, portalLinks, rolesFromDocs, COUNTRIES, DATE_FILTERS } from '../lib/api'
import { Search as SearchIcon, ExternalLink, Check, Sparkles, MapPin, Globe, Clock, Briefcase } from 'lucide-react'
import CandidacyModal from '../components/CandidacyModal'

export default function SearchPage() {
  const { docs, markApplied, isApplied } = useApp()
  const roles = rolesFromDocs(docs)

  const [refine, setRefine] = useState('')
  const [where, setWhere] = useState('')
  const [country, setCountry] = useState('ch')
  const [maxDays, setMaxDays] = useState('any')

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)
  const [candidacyJob, setCandidacyJob] = useState(null)

  const term = (refine.trim() || roles[0] || '')

  async function run() {
    setLoading(true); setErr(''); setSearched(true)
    try {
      const cities = where.split(',').map((s) => s.trim()).filter(Boolean)
      const list = cities.length ? cities : ['']
      const all = []
      const seen = new Set()
      for (const city of list) {
        const data = await searchJobs({ what: term || 'empleo', where: city, country, maxDaysOld: maxDays })
        for (const j of (data.results || [])) {
          if (seen.has(j.redirect_url || j.id)) continue
          seen.add(j.redirect_url || j.id)
          all.push(j)
        }
      }
      setResults(all)
    } catch (e) {
      setErr(e.message || 'No se pudieron cargar las ofertas.'); setResults([])
    } finally { setLoading(false) }
  }

  const visible = results.filter((j) => !isApplied(j))
  const links = portalLinks(country, term, where.split(',')[0] || '')

  return (
    <div>
      <h1 className="page-title">Ofertas para ti</h1>
      <p className="page-sub">La IA lee tus CVs y te busca ofertas. No hace falta que escribas el puesto.</p>

      <div className="card">
        {roles.length > 0 ? (
          <>
            <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--sky-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> La IA busca según tu CV
            </label>
            <div className="tabs" style={{ marginBottom: 14 }}>
              {roles.map((r) => <span key={r} className="chip active">{r}</span>)}
            </div>
          </>
        ) : (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            Añade un CV en tu perfil (pestaña Perfil) y la IA buscará ofertas por ti.
          </div>
        )}

        <div className="row">
          <div className="field">
            <label><MapPin size={13} style={{ verticalAlign: -2 }} /> Ciudad(es) — separa por comas</label>
            <input className="input" value={where} onChange={(e) => setWhere(e.target.value)}
              placeholder="Ginebra, Lausana, Berna..." onKeyDown={(e) => e.key === 'Enter' && run()} />
          </div>
          <div className="field">
            <label><Globe size={13} style={{ verticalAlign: -2 }} /> País</label>
            <select className="select" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--sky-700)', display: 'block' }}>Publicadas hace</label>
        <div className="tabs" style={{ marginBottom: 14 }}>
          {DATE_FILTERS.map((d) => (
            <span key={d.v} className={`chip ${maxDays === d.v ? 'active' : ''}`} onClick={() => setMaxDays(d.v)}>{d.label}</span>
          ))}
        </div>

        <div className="field">
          <label>Afinar búsqueda (opcional)</label>
          <input className="input" value={refine} onChange={(e) => setRefine(e.target.value)}
            placeholder="p. ej. ayudante de cocina, fin de semana..." />
        </div>

        <button className="btn block" onClick={run} disabled={loading || roles.length === 0}>
          {loading ? <span className="spinner" /> : <><SearchIcon size={18} /> Buscar ofertas para mí</>}
        </button>
      </div>

      {searched && (term || where) && (
        <div className="card">
          <p className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            Buscar también en los portales de {COUNTRIES.find((c) => c.code === country)?.name}:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {links.map((l) => (
              <a key={l.name} className="chip" href={l.href} target="_blank" rel="noreferrer">{l.name} <ExternalLink size={13} /></a>
            ))}
          </div>
        </div>
      )}

      {err && <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>{err}</div>}

      {searched && !loading && visible.length === 0 && !err && (
        <div className="empty"><Briefcase size={40} /><p>No hay ofertas nuevas con estos filtros. Prueba otra fecha o ciudad.</p></div>
      )}

      <AnimatePresence>
        {visible.map((job, i) => (
          <motion.div key={job.redirect_url || job.id} className="card job-item"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }} layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <h3>{job.title}</h3><span className="badge new">Nueva</span>
            </div>
            <div className="job-meta">
              <span><b>{job.company}</b></span><span>· {job.location}</span>
              {job.salary && <span>· 💰 {job.salary}</span>}
              {job.created && <span>· <Clock size={12} style={{ verticalAlign: -1 }} /> {new Date(job.created).toLocaleDateString('es-ES')}</span>}
            </div>
            {job.description && <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{job.description.slice(0, 160)}…</p>}
            <div className="job-actions">
              <a className="btn sm" href={job.redirect_url} target="_blank" rel="noreferrer">Ver y aplicar <ExternalLink size={15} /></a>
              <button className="btn sm ghost" onClick={() => setCandidacyJob(job)}><Sparkles size={15} /> Preparar con IA</button>
              <button className="btn sm ghost" onClick={() => markApplied(job)}><Check size={15} /> Ya apliqué</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {candidacyJob && (
          <CandidacyModal job={candidacyJob} onClose={() => setCandidacyJob(null)}
            onApplied={() => { markApplied(candidacyJob); setCandidacyJob(null) }} />
        )}
      </AnimatePresence>
    </div>
  )
}
