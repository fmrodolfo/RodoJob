import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { searchJobs, portalLinks, rolesFromDocs, aiJobSearch, geocodeCity, kmBetween, COUNTRIES, DATE_FILTERS } from '../lib/api'
import { Search as SearchIcon, ExternalLink, Check, Sparkles, Globe, Clock, Briefcase, X, Folder } from 'lucide-react'
import CandidacyModal from '../components/CandidacyModal'
import CityPicker from '../components/CityPicker'

export default function SearchPage() {
  const { activeProfile, docs, markApplied, isApplied, markDismissed, isDismissed } = useApp()
  const cvs = docs.filter((d) => d.type === 'cv')

  const [refine, setRefine] = useState('')
  const [cities, setCities] = useState([])
  const [country, setCountry] = useState('ch')
  const [maxDays, setMaxDays] = useState('any')
  const [deselected, setDeselected] = useState([])

  const [results, setResults] = useState([])
  const [termsUsed, setTermsUsed] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)
  const [candidacyJob, setCandidacyJob] = useState(null)

  const countryName = COUNTRIES.find((c) => c.code === country)?.name || ''
  const isSel = (id) => !deselected.includes(id)
  const toggleCv = (id) => setDeselected((d) => d.includes(id) ? d.filter((x) => x !== id) : [...d, id])
  const selectedCvs = cvs.filter((c) => isSel(c.id))

  // Trae ofertas para una lista de consultas {what, category}, con varias páginas
  async function fetchBatch(queries, cityList, pages) {
    const out = []
    for (const city of cityList) {
      for (const q of queries) {
        for (let pg = 1; pg <= pages; pg++) {
          const data = await searchJobs({ what: q.what, where: city, country, maxDaysOld: maxDays, category: q.category, page: pg })
          const rs = data.results || []
          out.push(...rs)
          if (rs.length < 50) break // no hay más páginas
        }
      }
    }
    return out
  }
  const uniqQ = (arr) => { const s = new Set(); return arr.filter((q) => { const k = q.what + '|' + q.category; if (s.has(k)) return false; s.add(k); return true }) }

  async function run() {
    setLoading(true); setErr(''); setNote(''); setSearched(true)
    try {
      if (!selectedCvs.length) { setErr('Selecciona al menos un CV para buscar.'); setLoading(false); return }
      setStatusMsg(refine.trim() ? 'Buscando ofertas…' : 'La IA está leyendo tus CVs…')

      // Consultas por CV: categoría del sector = máximo volumen relevante
      const queries = []; const display = []
      if (refine.trim()) {
        queries.push({ what: refine.trim(), category: '' })
      } else {
        for (const cv of selectedCvs) {
          let r
          try { r = await aiJobSearch({ profile: { name: activeProfile?.name, docs: [cv] }, country: countryName, city: cities[0]?.name }) }
          catch { r = { terms: rolesFromDocs([cv]), category: '' } }
          ;(r.terms || []).forEach((t) => display.push(t))
          if (r.category) queries.push({ what: '', category: r.category })
          else ((r.terms && r.terms.length) ? r.terms : rolesFromDocs([cv])).slice(0, 2).forEach((t) => queries.push({ what: t, category: '' }))
        }
      }
      const queriesU = uniqQ(queries)
      setTermsUsed([...new Set(display)])
      setStatusMsg('Buscando ofertas…')

      // Coordenadas de las ciudades elegidas (para filtrar por distancia real)
      const targets = []
      for (const c of cities) {
        if (c.lat != null && c.lon != null) targets.push(c)
        else { try { const g = await geocodeCity(c.name, country); if (g[0]) targets.push(g[0]) } catch { /* nada */ } }
      }

      // Traer ofertas de todo el país (mucho volumen) y filtrar por cercanía a la ciudad
      const seen = new Set(); const raw = []
      const add = (rs) => { for (const j of rs) { const k = j.redirect_url || j.id; if (!seen.has(k)) { seen.add(k); raw.push(j) } } }
      add(await fetchBatch(queriesU, [''], 3))

      const R = 35 // km a la redonda
      let all = raw
      if (cities.length) {
        // nombres del lugar en varios idiomas (Genève/Genf/Geneva) + cantón
        const aliasSets = cities.map((c) => (c.aliases && c.aliases.length ? c.aliases : [c.name]).map((a) => a.toLowerCase()))
        const near = raw.filter((j) => {
          const coordOk = targets.some((t) => j.latitude != null && j.longitude != null && kmBetween(t.lat, t.lon, j.latitude, j.longitude) <= R)
          if (coordOk) return true
          const hay = (String(j.location || '') + ' ' + (Array.isArray(j.area) ? j.area.join(' ') : '')).toLowerCase()
          return aliasSets.some((al) => al.some((a) => a && hay.includes(a)))
        })
        if (near.length) all = near
        else { all = raw; setNote(`No pude localizar ofertas justo en ${cities.map((c) => c.name).join(', ')}; te muestro las de todo el país (${countryName}).`) }
      }

      all.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0))
      setResults(all)
    } catch (e) {
      setErr(e.message || 'No se pudieron cargar las ofertas.'); setResults([])
    } finally { setLoading(false); setStatusMsg('') }
  }

  const visible = results.filter((j) => !isApplied(j) && !isDismissed(j))
  const links = portalLinks(country, termsUsed[0] || '', cities[0]?.name || '')

  return (
    <div>
      <h1 className="page-title">Ofertas para ti</h1>
      <p className="page-sub">La IA lee tus CVs y busca ofertas en el idioma del país. Tú eliges con qué CVs buscar.</p>

      <div className="card">
        {cvs.length === 0 ? (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            Añade un CV en tu perfil (pestaña Perfil) y la IA buscará ofertas por ti.
          </div>
        ) : (
          <>
            <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--sky-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Folder size={14} /> Buscar con estos CVs (toca para quitar/poner)
            </label>
            <div className="tabs" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
              {cvs.map((c) => (
                <span key={c.id} className={`chip ${isSel(c.id) ? 'active' : ''}`} onClick={() => toggleCv(c.id)}>
                  {isSel(c.id) ? <Check size={13} /> : <X size={13} />} {c.sector || c.title}
                </span>
              ))}
            </div>
          </>
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
          <label>Afinar búsqueda (opcional — busca solo esto en vez de tus CVs)</label>
          <input className="input" value={refine} onChange={(e) => setRefine(e.target.value)}
            placeholder="p. ej. serveur, ayudante de cocina…" />
        </div>

        <button className="btn block" onClick={run} disabled={loading || cvs.length === 0}>
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
        <div className="empty"><Briefcase size={40} /><p>No hay ofertas nuevas con estos filtros. Prueba otra ciudad, otra fecha, o los portales de arriba.</p></div>
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
              <button className="btn sm ghost" onClick={() => setCandidacyJob(job)}><Sparkles size={15} /> Carta con IA</button>
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
