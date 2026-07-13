// Función serverless: proxy a la API de Google Gemini (capa GRATUITA, sin tarjeta).
// La GEMINI_API_KEY vive aquí, nunca en el navegador.
// Consigue la clave gratis en https://aistudio.google.com/app/apikey

const MODEL = 'gemini-1.5-flash'
const SYSTEM = 'Eres un experto en recursos humanos y redacción de candidaturas. Escribes textos claros, honestos y persuasivos. Nunca inventas titulaciones o experiencias que el candidato no tiene.'

function buildPrompt(task, profile) {
  const cvs = (profile?.docs || [])
    .filter((d) => d.type === 'cv')
    .map((d) => `# CV (${d.sector || 'general'} — ${d.title})\n${d.text || ''}`)
    .join('\n\n') || '(sin CV cargado)'
  const letters = (profile?.docs || [])
    .filter((d) => d.type === 'carta')
    .map((d) => `# Carta (${d.title})\n${d.text || ''}`)
    .join('\n\n') || '(sin cartas cargadas)'
  const person = `Nombre del candidato: ${profile?.name || ''}\nMateriales del candidato:\n\n${cvs}\n\n${letters}`

  let instruction = ''
  if (task.kind === 'adaptCV') {
    instruction = `Adapta el CV del candidato al siguiente puesto. Reordena y reescribe para destacar la experiencia y habilidades más relevantes para esta oferta, sin inventar datos falsos. Devuelve SOLO el texto del CV listo para PDF, con secciones claras (Perfil, Experiencia, Formación, Habilidades, Idiomas). En español salvo que el puesto sea en otro idioma.\n\nOFERTA:\nPuesto: ${task.job.title}\nEmpresa: ${task.job.company}\nLugar: ${task.job.location}\nDescripción: ${task.job.description || ''}`
  } else if (task.kind === 'coverLetter') {
    instruction = `Redacta una carta de motivación profesional, cálida y convincente para este puesto, basada en la experiencia real del candidato. Máximo 300 palabras. Devuelve SOLO el texto de la carta (con saludo y despedida). Idioma según el puesto.\n\nOFERTA:\nPuesto: ${task.job.title}\nEmpresa: ${task.job.company}\nLugar: ${task.job.location}\nDescripción: ${task.job.description || ''}`
  } else if (task.kind === 'email') {
    instruction = `Redacta un correo electrónico breve y profesional de candidatura espontánea para "${task.company.name}" (${task.company.type || 'empresa'}) en ${task.company.location || ''}. El candidato busca trabajo en el sector. Incluye asunto en la primera línea con el formato "Asunto: ...". Máximo 180 palabras. Tono cordial y directo.`
  } else {
    instruction = task.prompt || 'Ayuda al candidato con su búsqueda de empleo.'
  }
  return `${person}\n\n---\n\nTAREA:\n${instruction}`
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido' })
  const key = process.env.GEMINI_API_KEY
  if (!key) return json(500, { error: 'Falta GEMINI_API_KEY en Netlify. Consíguela gratis en aistudio.google.com/app/apikey' })

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'JSON inválido' }) }
  const { task, profile } = payload
  if (!task) return json(400, { error: 'Falta "task"' })

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(task, profile) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1800 },
      }),
    })
    if (!r.ok) {
      const t = await r.text()
      return json(r.status, { error: 'Gemini: ' + t.slice(0, 300) })
    }
    const data = await r.json()
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim()
    if (!text) return json(200, { text: 'La IA no devolvió texto. Inténtalo de nuevo.' })
    return json(200, { text })
  } catch (e) {
    return json(500, { error: String(e.message || e) })
  }
}

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
