import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { FileText, Mail, Trash2, Plus, Camera, LogOut, Save, X } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

async function extractPdfText(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str).join(' ') + '\n'
  }
  return text.trim()
}

export default function ProfilePage() {
  const { activeProfile, updateProfile, logout, docs, addDocItem, deleteDocItem } = useApp()
  const [name, setName] = useState(activeProfile?.name || '')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function pickPhoto(e) {
    const f = e.target.files?.[0]
    if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)) }
  }
  async function saveProfile() {
    setSavingProfile(true)
    await updateProfile(activeProfile.id, { name: name.trim() || activeProfile.name }, photo)
    setPhoto(null); setSavingProfile(false)
  }

  const cvs = docs.filter((d) => d.type === 'cv')
  const cartas = docs.filter((d) => d.type === 'carta')

  return (
    <div>
      <h1 className="page-title">Mi perfil</h1>
      <p className="page-sub">Sube tus CVs (PDF o texto) y cartas. La IA los usa para adaptar tus candidaturas.</p>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            {preview || activeProfile?.photoURL
              ? <img src={preview || activeProfile.photoURL} className="avatar-mini" style={{ width: 72, height: 72 }} alt="" />
              : <div className="avatar-mini placeholder" style={{ width: 72, height: 72 }}><Camera size={24} /></div>}
            <input type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
          </label>
          <div style={{ flex: 1 }}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          </div>
        </div>
        <button className="btn block sm" style={{ marginTop: 12 }} onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? <span className="spinner" /> : <><Save size={16} /> Guardar cambios</>}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 800 }}>Mis documentos</h3>
          <button className="btn sm" onClick={() => setShowForm(true)}><Plus size={16} /> Añadir</button>
        </div>

        {docs.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Añade al menos un CV para que la IA pueda ayudarte a buscar y adaptar.</p>}

        {cvs.length > 0 && <p className="muted" style={{ fontSize: 12, fontWeight: 700, margin: '6px 0' }}>CVs</p>}
        {cvs.map((d) => <DocRow key={d.id} d={d} onDelete={() => deleteDocItem(d.id)} icon={<FileText size={18} />} />)}

        {cartas.length > 0 && <p className="muted" style={{ fontSize: 12, fontWeight: 700, margin: '12px 0 6px' }}>Cartas de motivación</p>}
        {cartas.map((d) => <DocRow key={d.id} d={d} onDelete={() => deleteDocItem(d.id)} icon={<Mail size={18} />} />)}
      </div>

      <button className="btn ghost block" style={{ marginTop: 14 }} onClick={logout}><LogOut size={16} /> Cerrar sesión</button>

      <AnimatePresence>
        {showForm && <DocForm onClose={() => setShowForm(false)} onSave={addDocItem} />}
      </AnimatePresence>
    </div>
  )
}

function DocRow({ d, onDelete, icon }) {
  return (
    <div className="doc-pill" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ color: 'var(--sky-600)' }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <b style={{ fontSize: 14, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</b>
          <span className="muted" style={{ fontSize: 12 }}>{d.sector ? d.sector + ' · ' : ''}{d.fileName ? '📎 ' + d.fileName : 'texto'}</span>
        </div>
      </div>
      <button onClick={onDelete} style={{ background: 'none', color: '#dc2626' }}><Trash2 size={17} /></button>
    </div>
  )
}

function DocForm({ onClose, onSave }) {
  const [type, setType] = useState('cv')
  const [title, setTitle] = useState('')
  const [sector, setSector] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [msg, setMsg] = useState('Si subes tu CV en PDF, la app lee su texto para que la IA lo adapte a cada oferta.')
  const [busy, setBusy] = useState(false)

  async function onPick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setFileName(f.name)
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''))
    setMsg('Leyendo PDF…')
    try {
      const extracted = await extractPdfText(f)
      setText(extracted)
      setMsg(`📎 ${f.name} — texto extraído (${extracted.length} caracteres). Revísalo abajo.`)
    } catch {
      setMsg(`📎 ${f.name} adjunto. No pude leer el texto automáticamente; pégalo abajo para que la IA lo adapte.`)
    }
  }

  async function save() {
    if (!title.trim() || !text.trim()) { setMsg('Pon un título y contenido (sube el PDF o pega el texto).'); return }
    setBusy(true)
    await onSave({ type, title: title.trim(), sector: sector.trim(), text: text.trim(), fileName }, file)
    setBusy(false); onClose()
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Añadir documento</h3>
          <button onClick={onClose} style={{ background: 'none' }}><X size={22} /></button>
        </div>

        <div className="tabs">
          <span className={`chip ${type === 'cv' ? 'active' : ''}`} onClick={() => setType('cv')}>CV</span>
          <span className={`chip ${type === 'carta' ? 'active' : ''}`} onClick={() => setType('carta')}>Carta de motivación</span>
        </div>

        <div className="field">
          <label>Subir PDF (opcional)</label>
          <input className="input" type="file" accept=".pdf" onChange={onPick} />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{msg}</p>
        </div>
        <div className="field">
          <label>Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'cv' ? 'p. ej. CV Hostelería' : 'p. ej. Carta general'} />
        </div>
        {type === 'cv' && (
          <div className="field">
            <label>Sector (la IA lo usa para buscar ofertas)</label>
            <input className="input" value={sector} onChange={(e) => setSector(e.target.value)}
              placeholder="p. ej. Hostelería, Logística, IT..." />
          </div>
        )}
        <div className="field">
          <label>Contenido (se rellena solo al subir el PDF, o pégalo aquí)</label>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Texto del CV/carta. La IA lo usa para adaptarlo a cada oferta." />
        </div>

        <button className="btn block" onClick={save} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Guardar documento'}
        </button>
      </motion.div>
    </motion.div>
  )
}
