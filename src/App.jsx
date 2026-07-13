import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from './context/AppContext'
import Intro from './components/Intro'
import Auth from './components/Auth'
import ProfileGate from './components/ProfileGate'
import Layout from './components/Layout'
import SearchPage from './pages/Search'
import AppliedPage from './pages/Applied'
import DirectoryPage from './pages/Directory'
import ProfilePage from './pages/Profile'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28 },
}

export default function App() {
  const { authLoading, user, activeProfile } = useApp()
  const [showIntro, setShowIntro] = useState(true)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 2600)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {showIntro && <Intro key="intro" />}

      {!showIntro && authLoading && (
        <motion.div key="loading" className="page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="spinner dark" />
        </motion.div>
      )}

      {!showIntro && !authLoading && !user && (
        <motion.div key="auth" {...fade}><Auth /></motion.div>
      )}

      {!showIntro && !authLoading && user && (!activeProfile || !entered) && (
        <motion.div key="gate" {...fade}>
          <ProfileGate onEnter={() => setEntered(true)} />
        </motion.div>
      )}

      {!showIntro && !authLoading && user && activeProfile && entered && (
        <motion.div key="app" {...fade}>
          <Layout onSwitchProfile={() => setEntered(false)}>
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/aplicadas" element={<AppliedPage />} />
              <Route path="/empresas" element={<DirectoryPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
