// Vercel Serverless Function: IA con Groq (gratis). Ruta: /api/ai
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192']
const SYSTEM = 'Eres un experto en recursos humanos y redacción de candidaturas. Escribes textos claros, honestos y persuasivos. Nunca inventas titulaciones o experiencias que el candidato no tiene.'

const trim = (t, max) => { t = (t || '').trim(); return t.length > max ? t.slice(0, max) + '…' : t }

function buildUserPrompt(task, profile) {
  const cvs = (profile?.docs || [])
    .filter((d) => d.type === 'cv').slice(0, 2)
    .map((d) => `# CV (${d.sector || 'general'} — ${d.title})\n${trim(d.text, 3000)}`)
    .join('\n\n') || '(sin CV cargado)'
  const letters = (profile?.docs || [])
    .filter((d) => d.type === 'carta').slice(0, 1)
    .map((d) => `# Carta (${d.title})\n${trim(d.text, 1500)}`)
    .join('\n\n') || '(sin cartas cargadas)'
  const person = `Nombre del candidato: ${profile?.name || ''}\nMateriales del candidato:\n\n${cvs}\n\n${letters}`
  if (task.job) task = { ...task, job: { ...task.job, description: trim(task.job.description, 1200) } }

  const lang = task.language && task.language !== 'auto'
    ? `Escribe el resultado en ${task.language}.`
    : 'Escribe en el idioma que corresponda a la oferta (si la descripción está en francés, en francés; etc.).'

  let instruction = ''
  if (task.kind === 'coverLetter') {
    instruction = `Redacta una carta de motivación profesional, cálida y convincente para este puesto, basada en la experiencia real del candidato. Máximo 300 palabras. ${lang}\nFORMATO: texto plano, SIN asteriscos, SIN almohadillas, SIN markdown. Devuelve SOLO el texto de la carta (con saludo inicial y despedida con el nombre del candidato).\n\nOFERTA:\nPuesto: ${task.job.title}\nEmpresa: ${task.job.company}\nLugar: ${task.job.location}\nDescripción: ${task.job.description || ''}`
  } else if (task.kind === 'jobTerms') {
    instruction = `A partir del CV del candidato, ayúdale a buscar empleo${task.city ? ` en ${task.city}` : ''} (${task.country || ''}).\nDevuelve el resultado en DOS partes separadas por una barra vertical " | ".\nPARTE 1: 3 puestos GENÉRICOS y CORTOS (1 o 2 palabras) que se ajusten al SECTOR REAL del candidato, en el idioma que se usa para buscar empleo en ese lugar (francés en Ginebra, alemán en Zúrich, español en Madrid). Evita palabras ambiguas; si el sector es hostelería usa términos claros como "serveur restaurant" o "employé restauration". Separa los 3 por comas.\nPARTE 2: la categoría que mejor encaje, elegida EXACTA de esta lista: it-jobs, engineering-jobs, hospitality-catering-jobs, logistics-warehouse-jobs, retail-jobs, healthcare-nursing-jobs, trade-construction-jobs, admin-jobs, sales-jobs, customer-services-jobs, teaching-jobs, manufacturing-jobs, maintenance-jobs, domestic-help-cleaning-jobs, other-general-jobs.\nResponde SOLO con esa única línea. Ejemplo: serveur restaurant, employé restauration, aide cuisine | hospitality-catering-jobs`
  } else if (task.kind === 'email') {
    instruction = `Redacta un correo electrónico breve y profesional de candidatura espontánea para "${task.company.name}" (${task.company.type || 'empresa'}) en ${task.company.location || ''}. ${lang} Incluye asunto en la primera línea con el formato "Asunto: ...". Máximo 180 palabras. Tono cordial y directo.`
  } else {
    instruction = task.prompt || 'Ayuda al candidato con su búsqueda de empleo.'
  }
  return `${person}\n\n---\n\nTAREA:\n${instruction}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(500).json({ error: 'Falta GROQ_API_KEY en Vercel. Consíguela gratis en console.groq.com/keys' })

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { task, profile } = payload
  if (!task) return res.status(400).json({ error: 'Falta "task"' })

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: buildUserPrompt(task, profile) },
  ]
  // Para elegir los puestos de búsqueda queremos resultados estables (poca aleatoriedad)
  const temperature = task.kind === 'jobTerms' ? 0.2 : 0.7

  let lastErr = ''
  for (const model of MODELS) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: 1400 }),
      })
      if (r.ok) {
        const data = await r.json()
        const text = (data.choices?.[0]?.message?.content || '').trim()
        return res.status(200).json({ text: text || 'La IA no devolvió texto. Inténtalo de nuevo.' })
      }
      const t = await r.text()
      lastErr = `Groq (${model}): ${t.slice(0, 200)}`
      if (!(r.status === 404 || r.status === 429 || r.status === 413 || /decommission|not found|does not exist|too large/i.test(t))) {
        return res.status(r.status).json({ error: lastErr })
      }
    } catch (e) {
      lastErr = String(e.message || e)
    }
  }
  return res.status(502).json({ error: 'La IA no está disponible ahora mismo. Inténtalo de nuevo en un momento. ' + lastErr })
}
