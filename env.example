import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ExternalLink, Undo2, CheckCircle, Building2 } from 'lucide-react'

export default function AppliedPage() {
  const { applied, unmarkApplied, contacts, deleteContact } = useApp()
  const [tab, setTab] = useState('ofertas')

  const jobs = [...applied].sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0))
  const comps = [...contacts].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  const showJobs = tab === 'ofertas'

  return (
    <div>
      <h1 className="page-title">Mis candidaturas</h1>
      <p className="page-sub">Todo lo que ya has enviado, en un mismo sitio.</p>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <span className={`chip ${showJobs ? 'active' : ''}`} onClick={() => setTab('ofertas')}>
          <CheckCircle size={15} /> Ofertas ({jobs.length})
        </span>
        <span className={`chip ${!showJobs ? 'active' : ''}`} onClick={() => setTab('empresas')}>
          <Building2 size={15} /> Empresas ({comps.length})
        </span>
      </div>

      {showJobs && jobs.length === 0 && (
        <div className="empty"><CheckCircle size={40} /><p>Todavía no has marcado ninguna oferta como aplicada.</p></div>
      )}
      {!showJobs && comps.length === 0 && (
        <div className="empty"><Building2 size={40} /><p>Todavía no has contactado ninguna empresa. Búscalas en la pestaña Empresas.</p></div>
      )}

      <AnimatePresence mode="popLayout">
        {showJobs && jobs.map((a) => (
          <motion.div key={a.id} className="card job-item"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <h3>{a.title}</h3><span className="badge applied">Aplicada</span>
            </div>
            <div className="job-meta">
              <span><b>{a.company}</b></span>{a.location && <span>· {a.location}</span>}
              {a.appliedAt?.seconds && <span>· {new Date(a.appliedAt.seconds * 1000).toLocaleDateString('es-ES')}</span>}
            </div>
            <div className="job-actions">
              {a.url && <a className="btn sm ghost" href={a.url} target="_blank" rel="noreferrer">Ver oferta <ExternalLink size={15} /></a>}
              <button className="btn sm ghost" onClick={() => unmarkApplied(a.id)}><Undo2 size={15} /> Devolver al buscador</button>
            </div>
          </motion.div>
        ))}

        {!showJobs && comps.map((c) => (
          <motion.div key={c.id} className="card job-item"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={17} /> {c.name}</h3>
              <span className="badge applied">Contactada</span>
            </div>
            <div className="job-meta">
              {c.location && <span>{c.location}</span>}
              {c.createdAt?.seconds && <span>· {new Date(c.createdAt.seconds * 1000).toLocaleDateString('es-ES')}</span>}
            </div>
            <div className="job-actions">
              {c.website && <a className="btn sm ghost" href={c.website} target="_blank" rel="noreferrer">Ver web <ExternalLink size={15} /></a>}
              <button className="btn sm ghost" onClick={() => deleteContact(c.id)}><Undo2 size={15} /> Quitar</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
