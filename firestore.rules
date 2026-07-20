import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import CandidacyModal from '../components/CandidacyModal'
import { Sparkles, Briefcase, Building2, MapPin } from 'lucide-react'

// Herramienta para crear cartas de motivación de ofertas EXTERNAS (encontradas fuera de la app).
export default function CoverLetterPage() {
  const { docs, markApplied } = useApp()
  const hasCV = docs.some((d) => d.type === 'cv')

  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [job, setJob] = useState(null)

  function create() {
    if (!title.trim() || !company.trim()) return
    setJob({
      title: title.trim(), company: company.trim(), location: location.trim(),
      description: description.trim(), redirect_url: '',
    })
  }

  return (
    <div>
      <h1 className="page-title">Cartas de motivación</h1>
      <p className="page-sub">¿Encontraste una oferta fuera de la app (jobup, Indeed, una web…)? Pon aquí sus datos y la IA te escribe la carta adaptada, con tu CV y tu diseño.</p>

      {!hasCV && (
        <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
          Añade al menos un CV en tu perfil para que la IA pueda escribir tu carta.
        </div>
      )}

      <div className="card">
        <div className="field">
          <label><Briefcase size={13} style={{ verticalAlign: -2 }} /> Título de la oferta *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. Valet de chambre" />
        </div>
        <div className="field">
          <label><Building2 size={13} style={{ verticalAlign: -2 }} /> Empresa *</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="p. ej. Hotel Bellevue" />
        </div>
        <div className="field">
          <label><MapPin size={13} style={{ verticalAlign: -2 }} /> Lugar (opcional)</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ginebra" />
        </div>
        <div className="field">
          <label>Descripción de la oferta (opcional — cuanto más pongas, mejor la carta)</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Pega aquí el texto de la oferta o lo que piden. Ayuda a la IA a adaptar mejor la carta." />
        </div>

        <button className="btn block" onClick={create} disabled={!title.trim() || !company.trim() || !hasCV}>
          <Sparkles size={18} /> Crear carta de motivación
        </button>
      </div>

      <AnimatePresence>
        {job && (
          <CandidacyModal job={job} onClose={() => setJob(null)}
            onApplied={() => { markApplied(job); setJob(null) }} />
        )}
      </AnimatePresence>
    </div>
  )
}
