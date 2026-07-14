import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { askAI } from '../lib/api'
import { letterToPdf } from '../lib/pdf'
import { fillDocxTemplate } from '../lib/docx'
import { X, Sparkles, FileDown, ExternalLink, Check, Mail, Copy, FileType2 } from 'lucide-react'

// Genera la CARTA DE MOTIVACIÓN adaptada a una oferta o empresa.
export default function CandidacyModal({ job, onClose, onApplied, companyMode = false }) {
  const { activeProfile, docs, getCoverTemplate } = useApp()
  const [letter, setLetter] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState('auto')

  const cvs = docs.filter((d) => d.type === 'cv')
  const hasCV = cvs.length > 0
  const templates = cvs.filter((d) => d.coverTemplateName)
  const [designId, setDesignId] = useState(templates[0]?.id || '')
  const profilePayload = { name: activeProfile?.name, docs }

  async function generate() {
    setErr(''); setBusy('gen')
    try {
      const text = await askAI({ task: { kind: 'coverLetter', job, language }, profile: profilePayload })
      setLetter(text)
    } catch (e) {
      setErr(e.message || 'Error al generar. Revisa la GROQ_API_KEY en Netlify.')
    } finally { setBusy('') }
  }

  function copy() { navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  function pdf() { letterToPdf({ subtitle: `${job.title} · ${job.company}`, body: letter, filename: `Carta_${slug(job.company)}.pdf` }) }
  async function word() {
    setErr(''); setBusy('word')
    try {
      const base64 = await getCoverTemplate(designId)
      if (!base64) { setErr('No encuentro la plantilla de carta. Revísala en tu perfil.'); return }
      const fecha = new Date().toLocaleDateString('es-ES')
      fillDocxTemplate(base64, { cuerpo: letter, empresa: job.company, puesto: job.title, lugar: job.location, fecha },
        `Carta_${slug(job.company)}.docx`)
    } catch (e) {
      setErr(e.message || 'No se pudo generar la carta en Word. Revisa que la marca {cuerpo} esté en tu plantilla.')
    } finally { setBusy('') }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18 }}>{job.title}</h3>
            <p className="muted" style={{ fontSize: 13 }}>{job.company}{job.location ? ` · ${job.location}` : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none' }}><X size={22} /></button>
        </div>

        <p className="muted" style={{ fontSize: 13, margin: '10px 0 14px' }}>
          La IA escribe tu carta de motivación adaptada a esta {companyMode ? 'empresa' : 'oferta'}, usando tus CVs. Revísala antes de enviarla.
        </p>

        {!hasCV && (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            Añade al menos un CV en tu perfil para que la IA conozca tu experiencia.
          </div>
        )}
        {err && <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 14 }}>{err}</div>}

        <div className="field">
          <label>Idioma de la carta</label>
          <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="auto">Automático (según la oferta)</option>
            <option value="español">Español</option>
            <option value="francés">Francés</option>
            <option value="alemán">Alemán</option>
            <option value="italiano">Italiano</option>
            <option value="inglés">Inglés</option>
            <option value="portugués">Portugués</option>
          </select>
        </div>

        <button className="btn block" onClick={generate} disabled={!hasCV || busy} style={{ marginBottom: 14 }}>
          {busy === 'gen' ? <span className="spinner" /> : <><Sparkles size={16} /> {letter ? 'Volver a generar carta' : 'Generar carta con IA'}</>}
        </button>

        {letter && (
          <>
            <textarea className="textarea" value={letter} onChange={(e) => setLetter(e.target.value)} style={{ minHeight: 220 }} />
            <p className="muted" style={{ fontSize: 12, margin: '6px 0 12px' }}>Puedes editar la carta antes de descargarla. Elige el formato:</p>

            {templates.length > 0 && (
              <div className="field">
                <label>Diseño de carta (tu plantilla .docx)</label>
                <select className="select" value={designId} onChange={(e) => setDesignId(e.target.value)}>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.sector || t.title} — {t.coverTemplateName}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn sm ghost" onClick={copy}>{copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar texto</>}</button>
              <button className="btn sm ghost" onClick={pdf}><FileDown size={15} /> PDF</button>
              {templates.length > 0 && (
                <button className="btn sm" onClick={word} disabled={busy}>
                  {busy === 'word' ? <span className="spinner" /> : <><FileType2 size={15} /> Word (mi diseño)</>}
                </button>
              )}
            </div>
          </>
        )}

        <div className="row" style={{ marginTop: 18 }}>
          <a className="btn" href={job.redirect_url} target="_blank" rel="noreferrer">Ir a la {companyMode ? 'web' : 'oferta'} <ExternalLink size={16} /></a>
          <button className="btn ghost" onClick={onApplied}><Check size={16} /> {companyMode ? 'Marcar contactada' : 'Marcar aplicada'}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const slug = (s) => (s || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
