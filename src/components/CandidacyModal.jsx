import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { askAI } from '../lib/api'
import { textToPdf } from '../lib/pdf'
import { X, Sparkles, FileDown, ExternalLink, Check, FileText, Mail } from 'lucide-react'

// Genera CV y carta adaptados a UNA oferta concreta (solo si el usuario lo pide).
export default function CandidacyModal({ job, onClose, onApplied, companyMode = false }) {
  const { activeProfile, docs } = useApp()
  const [cv, setCv] = useState('')
  const [letter, setLetter] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const hasCV = docs.some((d) => d.type === 'cv')
  const profilePayload = { name: activeProfile?.name, docs }

  async function gen(kind) {
    setErr(''); setBusy(kind)
    try {
      const text = await askAI({ task: { kind, job }, profile: profilePayload })
      if (kind === 'adaptCV') setCv(text)
      else setLetter(text)
    } catch (e) {
      setErr(e.message || 'Error al generar. Revisa la GEMINI_API_KEY en Netlify.')
    } finally { setBusy('') }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18 }}>{job.title}</h3>
            <p className="muted" style={{ fontSize: 13 }}>{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none' }}><X size={22} /></button>
        </div>

        <p className="muted" style={{ fontSize: 13, margin: '10px 0 16px' }}>
          La IA adaptará tu CV y tu carta a esta oferta usando tus documentos. Revisa siempre el resultado antes de enviarlo.
        </p>

        {!hasCV && (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            Añade al menos un CV en tu perfil para que la IA pueda adaptarlo.
          </div>
        )}
        {err && <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 14 }}>{err}</div>}

        <div className="row" style={{ marginBottom: 16 }}>
          <button className="btn sm" onClick={() => gen('adaptCV')} disabled={!hasCV || busy}>
            {busy === 'adaptCV' ? <span className="spinner" /> : <><Sparkles size={15} /> Adaptar CV</>}
          </button>
          <button className="btn sm" onClick={() => gen('coverLetter')} disabled={!hasCV || busy}>
            {busy === 'coverLetter' ? <span className="spinner" /> : <><Sparkles size={15} /> Generar carta</>}
          </button>
        </div>

        {cv && (
          <Result icon={<FileText size={16} />} title="CV adaptado" text={cv} onChange={setCv}
            onPdf={() => textToPdf({ title: `CV — ${activeProfile?.name || ''}`, subtitle: `${job.title} · ${job.company}`, body: cv, filename: `CV_${slug(job.company)}.pdf` })} />
        )}
        {letter && (
          <Result icon={<Mail size={16} />} title="Carta de motivación" text={letter} onChange={setLetter}
            onPdf={() => textToPdf({ title: `Carta de motivación`, subtitle: `${job.title} · ${job.company}`, body: letter, filename: `Carta_${slug(job.company)}.pdf` })} />
        )}

        <div className="row" style={{ marginTop: 18 }}>
          <a className="btn" href={job.redirect_url} target="_blank" rel="noreferrer">
            Ir a la oferta <ExternalLink size={16} />
          </a>
          <button className="btn ghost" onClick={onApplied}><Check size={16} /> {companyMode ? 'Marcar contactada' : 'Marcar aplicada'}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Result({ icon, title, text, onChange, onPdf }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <b style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {title}</b>
        <button className="btn sm" onClick={onPdf}><FileDown size={15} /> PDF</button>
      </div>
      <textarea className="textarea" value={text} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 200 }} />
    </div>
  )
}

const slug = (s) => (s || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
