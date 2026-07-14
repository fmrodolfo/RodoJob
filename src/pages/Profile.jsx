import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { FileText, Trash2, Plus, Camera, LogOut, Save, X, Folder, FileType2, Briefcase } from 'lucide-react'
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
const fileToBase64 = (f) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1])
  r.onerror = rej
  r.readAsDataURL(f)
})

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

  return (
    <div>
      <h1 className="page-title">Mi perfil</h1>
      <p className="page-sub">Sube tus CVs por sector. La IA los lee para buscarte ofertas y para adaptar tus cartas.</p>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 2px 12px' }}>
        <h3 style={{ fontWeight: 800 }}>Mis CVs por sector</h3>
        <button className="btn sm" onClick={() => setShowForm(true)}><Plus size={16} /> Añadir CV</button>
      </div>

      {cvs.length === 0 && (
        <div className="empty"><Folder size={40} /><p>Añade tu primer CV. Se creará una carpeta con su sector, donde también podrás poner tu plantilla de carta de motivación.</p></div>
      )}

      {cvs.map((d) => <CvFolder key={d.id} d={d} onDelete={() => deleteDocItem(d.id)} />)}

      <button className="btn ghost block" style={{ marginTop: 18 }} onClick={logout}><LogOut size={16} /> Cerrar sesión</button>

      <AnimatePresence>
        {showForm && <AddCvForm onClose={() => setShowForm(false)} onSave={addDocItem} />}
      </AnimatePresence>
    </div>
  )
}

// ---- Carpeta de un sector: CV + plantilla de carta ----
function CvFolder({ d, onDelete }) {
  const { saveCoverTemplate, deleteCoverTemplate } = useApp()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function pickCover(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.docx')) { setMsg('Debe ser un archivo .docx (Word).'); return }
    setBusy(true); setMsg('Guardando…')
    try {
      const base64 = await fileToBase64(f)
      if (base64.length > 950000) { setMsg('El .docx es demasiado grande. Prueba uno más ligero.'); setBusy(false); return }
      await saveCoverTemplate(d.id, base64, f.name)
      setMsg('')
    } catch { setMsg('No se pudo guardar.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder size={18} style={{ color: 'var(--sky-600)' }} /> {d.sector || d.title || 'CV'}
        </h3>
        <button onClick={onDelete} style={{ background: 'none', color: '#dc2626' }} title="Eliminar carpeta"><Trash2 size={17} /></button>
      </div>

      <div className="doc-pill" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <FileText size={17} style={{ color: 'var(--sky-600)' }} />
          <div style={{ minWidth: 0 }}>
            <b style={{ fontSize: 13, display: 'block' }}>CV</b>
            <span className="muted" style={{ fontSize: 12 }}>{d.fileName || 'texto pegado'}</span>
          </div>
        </div>
        <span className="badge new">lo lee la IA</span>
      </div>

      <div style={{ marginTop: 8 }}>
        {d.coverTemplateName ? (
          <div className="doc-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <FileType2 size={17} style={{ color: 'var(--sky-600)' }} />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 13, display: 'block' }}>Plantilla de carta</b>
                <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 180 }}>{d.coverTemplateName}</span>
              </div>
            </div>
            <button onClick={() => deleteCoverTemplate(d.id)} style={{ background: 'none', color: '#dc2626' }}><Trash2 size={16} /></button>
          </div>
        ) : (
          <label className="btn sm ghost block" style={{ cursor: 'pointer' }}>
            {busy ? <span className="spinner dark" /> : <><Plus size={15} /> Añadir plantilla de carta (.docx)</>}
            <input type="file" accept=".docx" onChange={pickCover} style={{ display: 'none' }} disabled={busy} />
          </label>
        )}
        {msg && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{msg}</p>}
        {!d.coverTemplateName && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
            En tu carta .docx, escribe la marca <code>{'{cuerpo}'}</code> donde va el texto. La app respeta tu diseño y la IA rellena ese hueco adaptado a cada oferta.
          </p>
        )}
      </div>
    </div>
  )
}

function AddCvForm({ onClose, onSave }) {
  const [sector, setSector] = useState('')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [msg, setMsg] = useState('Sube tu CV en PDF: la app lee su texto para que la IA busque ofertas que encajen.')
  const [busy, setBusy] = useState(false)

  async function onPick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    setMsg('Leyendo PDF…')
    try {
      const extracted = await extractPdfText(f)
      setText(extracted)
      setMsg(`📎 ${f.name} — texto leído (${extracted.length} caracteres).`)
    } catch {
      setMsg(`📎 ${f.name} adjunto. No pude leer el texto; pégalo abajo.`)
    }
  }

  async function save() {
    if (!sector.trim() || !text.trim()) { setMsg('Pon el sector y sube el PDF (o pega el texto).'); return }
    setBusy(true)
    await onSave({ type: 'cv', title: sector.trim(), sector: sector.trim(), text: text.trim(), fileName })
    setBusy(false); onClose()
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Añadir CV</h3>
          <button onClick={onClose} style={{ background: 'none' }}><X size={22} /></button>
        </div>

        <div className="field">
          <label><Briefcase size={13} style={{ verticalAlign: -2 }} /> Sector (nombre de la carpeta)</label>
          <input className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="p. ej. Hostelería, Logística, Construcción..." />
        </div>
        <div className="field">
          <label>CV en PDF</label>
          <input className="input" type="file" accept=".pdf" onChange={onPick} />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{msg}</p>
        </div>
        <div className="field">
          <label>Texto del CV (se rellena al subir el PDF, o pégalo)</label>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="La IA usa este texto para buscarte ofertas que encajen con tu perfil." />
        </div>

        <button className="btn block" onClick={save} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Crear carpeta'}
        </button>
      </motion.div>
    </motion.div>
  )
}
