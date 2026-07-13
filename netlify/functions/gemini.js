// Función serverless: proxy a la API de Google Gemini (capa GRATUITA, sin tarjeta).
// La GEMINI_API_KEY vive aquí, nunca en el navegador.
// Consigue la clave gratis en https://aistudio.google.com/app/apikey

// Se prueban varios modelos por orden; si Google cambia/retira uno, usa el siguiente.
const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash-latest']
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

  const lang = task.language && task.language !== 'auto'
    ? `Escribe el resultado en ${task.language}.`
    : 'Escribe en el idioma que corresponda a la oferta (si la descripción está en francés, en francés; etc.).'

  let instruction = ''
  if (task.kind === 'adaptCV') {
    instruction = `Adapta el CV del candidato al siguiente puesto. Reordena y reescribe para destacar la experiencia y habilidades más relevantes para esta oferta, sin inventar datos falsos. ${lang} Devuelve SOLO el texto del CV listo para PDF, con secciones claras (Perfil, Experiencia, Formación, Habilidades, Idiomas).\n\nOFERTA:\nPuesto: ${task.job.title}\nEmpresa: ${task.job.company}\nLugar: ${task.job.location}\nDescripción: ${task.job.description || ''}`
  } else if (task.kind === 'coverLetter') {
    instruction = `Redacta una carta de motivación profesional, cálida y convincente para este puesto, basada en la experiencia real del candidato. Máximo 300 palabras. ${lang} Devuelve SOLO el texto de la carta (con saludo y despedida).\n\nOFERTA:\nPuesto: ${task.job.title}\nEmpresa: ${task.job.company}\nLugar: ${task.job.location}\nDescripción: ${task.job.description || ''}`
  } else if (task.kind === 'jobTerms') {
    instruction = `A partir del CV del candidato, indica los 3 puestos de trabajo más adecuados para que busque empleo${task.city ? ` en ${task.city}` : ''} (${task.country || ''}). MUY IMPORTANTE: devuelve los puestos en el idioma que se usa habitualmente para buscar empleo en ese lugar (por ejemplo francés en Ginebra, alemán en Zúrich, español en Madrid, inglés en Londres). Responde SOLO con los 3 puestos separados por comas, en minúsculas, sin números, guiones ni explicaciones. Ejemplo de formato: serveur, commis de cuisine, employé de restaurant`
  } else if (task.kind === 'email') {
    instruction = `Redacta un correo electrónico breve y profesional de candidatura espontánea para "${task.company.name}" (${task.company.type || 'empresa'}) en ${task.company.location || ''}. ${lang} Incluye asunto en la primera línea con el formato "Asunto: ...". Máximo 180 palabras. Tono cordial y directo.`
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

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: buildPrompt(task, profile) }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1800 },
  })

  let lastErr = ''
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      if (r.ok) {
        const data = await r.json()
        const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim()
        return json(200, { text: text || 'La IA no devolvió texto. Inténtalo de nuevo.' })
      }
      const t = await r.text()
      lastErr = `Gemini (${model}): ${t.slice(0, 200)}`
      // Solo probamos otro modelo si el problema es que este no existe/soporta
      if (!(r.status === 404 || /not found|not supported/i.test(t))) {
        return json(r.status, { error: lastErr })
      }
    } catch (e) {
      lastErr = String(e.message || e)
    }
  }
  return json(502, { error: 'No encontré un modelo de Gemini disponible para tu clave. ' + lastErr })
}

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
