import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { searchJobs, portalLinks, rolesFromDocs, aiJobTerms, COUNTRIES, DATE_FILTERS } from '../lib/api'
import { Search as SearchIcon, ExternalLink, Check, Sparkles, Globe, Clock, Briefcase, X } from 'lucide-react'
import CandidacyModal from '../components/CandidacyModal'
import CityPicker from '../components/CityPicker'

export default function SearchPage() {
  const { activeProfile, docs, markApplied, isApplied, markDismissed, isDismissed } = useApp()

  const [refine, setRefine] = useState('')
  const [cities, setCities] = useState([])
  const [country, setCountry] = useState('ch')
  const [maxDays, setMaxDays] = useState('any')

  const [results, setResults] = useState([])
  const [termsUsed, setTermsUsed] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)
  const [candidacyJob, setCandidacyJob] = useState(null)

  const hasCV = docs.some((d) => d.type === 'cv')
  const countryName = COUNTRIES.find((c) => c.code === country)?.name || ''

  async function decideTerms() {
    if (refine.trim()) return [refine.trim()]
    // La IA lee el CV y da puestos en el idioma del país
    try {
      const terms = await aiJobTerms({
        profile: { name: activeProfile?.name, docs },
        country: countryName, city: cities[0],
      })
      if (terms.length) return terms
    } catch { /* si falla la IA, usamos lo derivado del CV */ }
    const roles = rolesFromDocs(docs)
    return roles.length ? roles : ['empleo']
  }

  async function runSearch(terms, cityList) {
    const all = []; const seen = new Set()
    for (const city of cityList) {
      for (const t of terms) {
        const data = await searchJobs({ what: t, where: city, country, maxDaysOld: maxDays })
        for (const j of (data.results || [])) {
          const k = j.redirect_url || j.id
          if (!seen.has(k)) { seen.add(k); all.push(j) }
        }
      }
    }
    return all
  }

  async function run() {
    setLoading(true); setErr(''); setNote(''); setSearched(true)
    try {
      setStatusMsg(refine.trim() ? 'Buscando ofertas…' : 'La IA está leyendo tu CV…')
      const terms = await decideTerms()
      setTermsUsed(terms)
      setStatusMsg('Buscando ofertas…')
      let all = await runSearch(terms, cities.length ? cities : [''])
      if (all.length === 0 && cities.length) {
        // respaldo: buscar en todo el país si la ciudad no dio resultados
        all = await runSearch(terms, [''])
        if (all.length) setNote(`No encontré ofertas exactamente en ${cities.join(', ')}; te muestro las de todo el país (${countryName}).`)
      }
      setResults(all)
    } catch (e) {
      setErr(e.message || 'No se pudieron cargar las ofertas.'); setResults([])
    } finally { setLoading(false); setStatusMsg('') }
  }

  const visible = results.filter((j) => !isApplied(j) && !isDismissed(j))
  const links = portalLinks(country, termsUsed[0] || '', cities[0] || '')

  return (
    <div>
      <h1 className="page-title">Ofertas para ti</h1>
      <p className="page-sub">La IA lee tus CVs y busca ofertas en el idioma del país. No hace falta que escribas el puesto.</p>

      <div className="card">
        {!hasCV && (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            Añade un CV en tu perfil (pestaña Perfil) y la IA buscará ofertas por ti.
          </div>
        )}

        <div className="field">
          <label><Globe size={13} style={{ verticalAlign: -2 }} /> País</label>
          <select className="select" value={country} onChange={(e) => { setCountry(e.target.value); setCities([]) }}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Ciudad(es) — escribe y elige de la lista</label>
          <CityPicker cities={cities} onChange={setCities} country={country} placeholder="Ginebra, Lausana, Berna…" />
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
            placeholder="p. ej. serveur, ayudante de cocina…" />
        </div>

        <button className="btn block" onClick={run} disabled={loading || !hasCV}>
          {loading ? <><span className="spinner" /> {statusMsg}</> : <><SearchIcon size={18} /> Buscar ofertas para mí</>}
        </button>
      </div>

      {termsUsed.length > 0 && searched && !loading && (
        <div className="card">
          <p className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> La IA buscó estos puestos:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {termsUsed.map((t) => <span key={t} className="chip active">{t}</span>)}
          </div>
        </div>
      )}

      {note && <div className="card" style={{ background: 'var(--sky-50)', border: '1px solid var(--sky-200)', fontSize: 13 }}>{note}</div>}

      {searched && (termsUsed.length > 0 || cities.length) && (
        <div className="card">
          <p className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Buscar también en los portales de {countryName}:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {links.map((l) => <a key={l.name} className="chip" href={l.href} target="_blank" rel="noreferrer">{l.name} <ExternalLink size={13} /></a>)}
          </div>
        </div>
      )}

      {err && <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>{err}</div>}

      {searched && !loading && visible.length === 0 && !err && (
        <div className="empty"><Briefcase size={40} /><p>No hay ofertas nuevas con estos filtros. Prueba otra ciudad, otra fecha, o escribe un puesto en "Afinar búsqueda".</p></div>
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
              <button className="btn sm ghost" onClick={() => markDismissed(job)} title="No me interesa"><X size={15} /> Descartar</button>
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
