import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { LogIn, UserPlus } from 'lucide-react'

export default function Auth() {
  const { login, register, firebaseReady } = useApp()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), pass)
      else await register(email.trim(), pass)
    } catch (e) {
      setErr(traducirError(e.code || e.message))
    } finally { setBusy(false) }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <motion.div className="card" style={{ width: '100%' }}
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="center" style={{ marginBottom: 18 }}>
          <img src="/logo.svg" width="54" height="54" alt="" />
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>
            Rodo<span className="job">Job</span>
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Inicia sesión con el mismo correo en todos tus teléfonos para sincronizar tus datos.
          </p>
        </div>

        {!firebaseReady && (
          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 14 }}>
            <b>Falta configurar Firebase.</b> Añade tus datos en el archivo <code>.env</code> (o en Netlify) y vuelve a desplegar.
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input className="input" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" required minLength={6} value={pass}
              onChange={(e) => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          {err && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          <button className="btn block" disabled={busy || !firebaseReady}>
            {busy ? <span className="spinner" /> : mode === 'login'
              ? <><LogIn size={18} /> Entrar</>
              : <><UserPlus size={18} /> Crear cuenta</>}
          </button>
        </form>

        <p className="center muted" style={{ marginTop: 16, fontSize: 14 }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <a onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}
            style={{ cursor: 'pointer', fontWeight: 700 }}>
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </a>
        </p>
      </motion.div>
    </div>
  )
}

function traducirError(code) {
  const map = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email': 'El correo no es válido.',
  }
  return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.'
}
