import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, db, firebaseReady } from '../firebase'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from 'firebase/auth'
import {
  collection, doc, setDoc, addDoc, deleteDoc, updateDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'

// Convierte una imagen a un data URL comprimido (para guardarla en Firestore sin Storage)
function imageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 320
        let { width, height } = img
        if (width > height && width > max) { height = Math.round(height * max / width); width = max }
        else if (height > max) { width = Math.round(width * max / height); height = max }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

// id estable por título + empresa + lugar (junta duplicados de la misma oferta)
export function jobKey(job) {
  const base = `${job.title || ''}|${job.company || ''}|${job.location || ''}`
    .toLowerCase().replace(/\s+/g, ' ').trim()
  let h = 0
  for (let i = 0; i < base.length; i++) { h = (h * 31 + base.charCodeAt(i)) | 0 }
  return 'j' + Math.abs(h).toString(36)
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [profiles, setProfiles] = useState([])
  const [activeId, setActiveId] = useState(() => localStorage.getItem('rj_active') || null)

  const [docs, setDocs] = useState([])
  const [applied, setApplied] = useState([])
  const [contacts, setContacts] = useState([])
  const [dismissed, setDismissed] = useState([])

  // Estado de la búsqueda de ofertas (persiste al cambiar de pestaña)
  const defaultSearch = () => ({
    cities: [], country: 'ch', maxDays: 'any', deselected: [], refine: '',
    results: [], termsUsed: [], note: '', searched: false,
    queries: [], whereList: [], targets: [], page: 1, localized: false, exhausted: false,
  })
  const [searchState, setSearchRaw] = useState(defaultSearch)
  const setSearchState = useCallback((patch) => setSearchRaw((s) => ({ ...s, ...patch })), [])

  // --- Auth ---
  useEffect(() => {
    if (!firebaseReady) { setAuthLoading(false); return }
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false) })
  }, [])

  const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass)
  const register = (email, pass) => createUserWithEmailAndPassword(auth, email, pass)
  const logout = () => signOut(auth)

  // --- Perfiles (sincronizados) ---
  useEffect(() => {
    if (!user) { setProfiles([]); return }
    const q = query(collection(db, 'users', user.uid, 'profiles'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProfiles(list)
      setActiveId((cur) => (cur && list.some((p) => p.id === cur)) ? cur : (list[0]?.id || null))
    })
  }, [user])

  useEffect(() => { if (activeId) localStorage.setItem('rj_active', activeId) }, [activeId])
  // al cambiar de perfil, se limpia la búsqueda guardada
  useEffect(() => { setSearchRaw(defaultSearch()) }, [activeId])

  const activeProfile = profiles.find((p) => p.id === activeId) || null

  // --- Subcolecciones del perfil activo ---
  useEffect(() => {
    if (!user || !activeId) { setDocs([]); setApplied([]); setContacts([]); setDismissed([]); return }
    const p = ['users', user.uid, 'profiles', activeId]
    const unsubs = [
      onSnapshot(collection(db, ...p, 'docs'), (s) =>
        setDocs(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...p, 'applied'), (s) =>
        setApplied(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...p, 'contacts'), (s) =>
        setContacts(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...p, 'dismissed'), (s) =>
        setDismissed(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ]
    return () => unsubs.forEach((u) => u())
  }, [user, activeId])

  // --- CRUD perfiles ---
  const createProfile = useCallback(async (name, photoFile) => {
    if (!user) return
    const pRef = await addDoc(collection(db, 'users', user.uid, 'profiles'), {
      name: name || 'Nuevo perfil', photoURL: '', createdAt: serverTimestamp(),
    })
    if (photoFile) {
      const url = await imageToDataURL(photoFile)
      await updateDoc(pRef, { photoURL: url })
    }
    setActiveId(pRef.id)
    return pRef.id
  }, [user])

  const updateProfile = useCallback(async (id, data, photoFile) => {
    if (!user) return
    const pRef = doc(db, 'users', user.uid, 'profiles', id)
    let patch = { ...data }
    if (photoFile) patch.photoURL = await imageToDataURL(photoFile)
    await updateDoc(pRef, patch)
  }, [user])

  const deleteProfile = useCallback(async (id) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'profiles', id))
  }, [user])

  // --- CRUD documentos (CV / carta) ---
  // Guardamos el texto del CV/carta (no el archivo original) para no necesitar Storage.
  const addDocItem = useCallback(async (data) => {
    if (!user || !activeId) return
    await addDoc(collection(db, 'users', user.uid, 'profiles', activeId, 'docs'), {
      ...data, createdAt: serverTimestamp(),
    })
  }, [user, activeId])

  const deleteDocItem = useCallback(async (id) => {
    if (!user || !activeId) return
    await deleteDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', id))
  }, [user, activeId])

  // --- Aplicadas (sin duplicados: id = jobKey) ---
  const markApplied = useCallback(async (job) => {
    if (!user || !activeId) return
    const key = jobKey(job)
    await setDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'applied', key), {
      title: job.title, company: job.company, location: job.location,
      url: job.redirect_url || job.url || '', appliedAt: serverTimestamp(),
    })
  }, [user, activeId])

  const unmarkApplied = useCallback(async (key) => {
    if (!user || !activeId) return
    await deleteDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'applied', key))
  }, [user, activeId])

  const isApplied = useCallback((job) => applied.some((a) => a.id === jobKey(job)), [applied])

  // --- Descartadas (ofertas que no interesan; no vuelven a salir) ---
  const markDismissed = useCallback(async (job) => {
    if (!user || !activeId) return
    const key = jobKey(job)
    await setDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'dismissed', key), {
      title: job.title, company: job.company, dismissedAt: serverTimestamp(),
    })
  }, [user, activeId])

  const isDismissed = useCallback((job) => dismissed.some((d) => d.id === jobKey(job)), [dismissed])

  // --- Contactos (empresas / hoteles / restaurantes) ---
  const addContact = useCallback(async (data) => {
    if (!user || !activeId) return
    await addDoc(collection(db, 'users', user.uid, 'profiles', activeId, 'contacts'), {
      ...data, createdAt: serverTimestamp(),
    })
  }, [user, activeId])

  const toggleContactSent = useCallback(async (id, sent) => {
    if (!user || !activeId) return
    await updateDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'contacts', id), { sent })
  }, [user, activeId])

  const deleteContact = useCallback(async (id) => {
    if (!user || !activeId) return
    await deleteDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'contacts', id))
  }, [user, activeId])

  // --- Plantilla de CARTA en Word (.docx) por cada CV/carpeta ---
  const saveCoverTemplate = useCallback(async (docId, base64, name) => {
    if (!user || !activeId) return
    await setDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', docId, 'assets', 'coverTemplate'), { data: base64, name })
    await updateDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', docId), { coverTemplateName: name })
  }, [user, activeId])

  const getCoverTemplate = useCallback(async (docId) => {
    if (!user || !activeId) return null
    const snap = await getDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', docId, 'assets', 'coverTemplate'))
    return snap.exists() ? snap.data().data : null
  }, [user, activeId])

  const deleteCoverTemplate = useCallback(async (docId) => {
    if (!user || !activeId) return
    await deleteDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', docId, 'assets', 'coverTemplate'))
    await updateDoc(doc(db, 'users', user.uid, 'profiles', activeId, 'docs', docId), { coverTemplateName: '' })
  }, [user, activeId])

  const value = {
    firebaseReady, user, authLoading, login, register, logout,
    profiles, activeId, setActiveId, activeProfile,
    createProfile, updateProfile, deleteProfile,
    docs, addDocItem, deleteDocItem,
    applied, markApplied, unmarkApplied, isApplied,
    dismissed, markDismissed, isDismissed,
    searchState, setSearchState,
    contacts, addContact, toggleContactSent, deleteContact,
    saveCoverTemplate, getCoverTemplate, deleteCoverTemplate,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
