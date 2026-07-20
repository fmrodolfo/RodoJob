import { motion } from 'framer-motion'

// Animación de bienvenida con el logo y el nombre RodoJob
export default function Intro() {
  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #7dd3fc 0%, #0ea5e9 55%, #0369a1 100%)',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* halo animado */}
      <motion.div
        style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)',
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.3, 1], opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />

      <motion.div
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.15 }}
        style={{
          width: 108, height: 108, borderRadius: 30, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 50px -15px rgba(0,0,0,0.35)',
        }}
      >
        <img src="/logo.svg" alt="RodoJob" style={{ width: 66, height: 66 }} />
      </motion.div>

      <motion.h1
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        style={{ color: '#fff', fontSize: 40, fontWeight: 900, letterSpacing: '-1px', marginTop: 26 }}
      >
        Rodo<span style={{ color: '#e0f2fe' }}>Job</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8, fontWeight: 600, letterSpacing: '2px', fontSize: 13 }}
      >
        TU ASISTENTE DE EMPLEO
      </motion.p>

      <motion.div
        style={{ position: 'absolute', bottom: 60 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
      >
        <div className="spinner" />
      </motion.div>
    </motion.div>
  )
}
