// Llamadas a las funciones serverless de Netlify (las keys viven en el servidor)

export const COUNTRIES = [
  { code: 'ch', name: 'Suiza' }, { code: 'es', name: 'España' },
  { code: 'gb', name: 'Reino Unido' }, { code: 'fr', name: 'Francia' },
  { code: 'de', name: 'Alemania' }, { code: 'us', name: 'EE. UU.' },
  { code: 'it', name: 'Italia' }, { code: 'nl', name: 'Países Bajos' },
  { code: 'at', name: 'Austria' }, { code: 'ca', name: 'Canadá' },
]

export const DATE_FILTERS = [
  { v: 'any', label: 'Cualquier fecha' }, { v: '1', label: '24 horas' },
  { v: '7', label: '7 días' }, { v: '15', label: '15 días' }, { v: '30', label: '30 días' },
]

export const SECTORS = [
  { key: 'restaurantes', label: 'Restaurantes' }, { key: 'hoteles', label: 'Hoteles' },
  { key: 'cafeterias', label: 'Cafeterías / Bares' }, { key: 'logistica', label: 'Logística / Transporte' },
  { key: 'retail', label: 'Comercio / Tiendas' }, { key: 'supermercados', label: 'Supermercados' },
  { key: 'salud', label: 'Salud / Farmacias' }, { key: 'belleza', label: 'Peluquería / Belleza' },
  { key: 'construccion', label: 'Construcción' }, { key: 'general', label: 'Empresas (general)' },
]

// Portales de empleo por país para enlaces de búsqueda directos.
export const JOB_PORTALS = {
  ch: [
    { name: 'jobup', url: (q, l) => `https://www.jobup.ch/es/empleos/?term=${q}&location=${l}` },
    { name: 'jobs.ch', url: (q, l) => `https://www.jobs.ch/es/vacantes/?term=${q}&location=${l}` },
    { name: 'Indeed CH', url: (q, l) => `https://ch.indeed.com/jobs?q=${q}&l=${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
  ],
  es: [
    { name: 'InfoJobs', url: (q) => `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${q}` },
    { name: 'Indeed ES', url: (q, l) => `https://es.indeed.com/jobs?q=${q}&l=${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
  ],
  gb: [
    { name: 'Indeed UK', url: (q, l) => `https://uk.indeed.com/jobs?q=${q}&l=${l}` },
    { name: 'Reed', url: (q, l) => `https://www.reed.co.uk/jobs/${q}-jobs-in-${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
  ],
  fr: [
    { name: 'Indeed FR', url: (q, l) => `https://fr.indeed.com/emplois?q=${q}&l=${l}` },
    { name: 'HelloWork', url: (q, l) => `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${q}&l=${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
  ],
  de: [
    { name: 'Indeed DE', url: (q, l) => `https://de.indeed.com/jobs?q=${q}&l=${l}` },
    { name: 'StepStone', url: (q, l) => `https://www.stepstone.de/jobs/${q}/in-${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
  ],
  us: [
    { name: 'Indeed US', url: (q, l) => `https://www.indeed.com/jobs?q=${q}&l=${l}` },
    { name: 'LinkedIn', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
    { name: 'Glassdoor', url: (q) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}` },
  ],
}
export function portalLinks(country, what, where) {
  const q = encodeURIComponent(what || ''), l = encodeURIComponent(where || '')
  return (JOB_PORTALS[country] || JOB_PORTALS.es).map((p) => ({ name: p.name, href: p.url(q, l) }))
}

// Deriva puestos a buscar a partir de los CVs del perfil (la "IA lee tu CV").
const ROLE_MAP = {
  'hostelería': 'camarero', 'hosteleria': 'camarero', 'restauración': 'camarero', 'restauracion': 'camarero',
  'logística': 'mozo de almacén', 'logistica': 'mozo de almacén', 'transporte': 'conductor',
  'it': 'desarrollador', 'tecnología': 'desarrollador', 'tecnologia': 'desarrollador', 'informática': 'desarrollador',
  'salud': 'auxiliar de enfermería', 'construcción': 'peón de obra', 'construccion': 'peón de obra',
  'retail': 'dependiente', 'comercio': 'dependiente', 'limpieza': 'personal de limpieza',
}
export function rolesFromDocs(docs) {
  const cvs = (docs || []).filter((d) => d.type === 'cv')
  const roles = []
  for (const d of cvs) {
    const s = (d.sector || '').trim().toLowerCase()
    if (s && ROLE_MAP[s]) roles.push(ROLE_MAP[s])
    else if (s) roles.push(d.sector.trim())
    else {
      const t = (d.title || '').replace(/^cv\s*/i, '').trim()
      if (t) roles.push(t)
    }
  }
  return [...new Set(roles)]
}

export async function searchJobs({ what, where, country, maxDaysOld, category, page }) {
  const params = new URLSearchParams({ what, where, country })
  if (maxDaysOld && maxDaysOld !== 'any') params.set('max_days_old', String(maxDaysOld))
  if (category) params.set('category', category)
  if (page) params.set('page', String(page))
  const res = await fetch(`/api/jobs?${params.toString()}`)
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Error ${res.status} al buscar ofertas`)
  return res.json()
}

export async function searchCompanies({ where, sector }) {
  const params = new URLSearchParams({ where, sector })
  const res = await fetch(`/api/companies?${params.toString()}`)
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Error ${res.status} al buscar empresas`)
  return res.json()
}

// Distancia en km entre dos coordenadas (Haversine)
export function kmBetween(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = (d) => (d * Math.PI) / 180
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function geocodeCity(q, country) {
  const params = new URLSearchParams({ q })
  if (country) params.set('country', country)
  const res = await fetch(`/api/geocode?${params.toString()}`)
  if (!res.ok) return []
  return res.json()
}

// La IA lee el CV y devuelve puestos (idioma del país) + una categoría de Adzuna.
export async function aiJobSearch({ profile, country, city }) {
  const text = await askAI({ task: { kind: 'jobTerms', country, city }, profile })
  let termsPart = text, category = ''
  const pipe = text.split('|')
  if (pipe.length > 1) { termsPart = pipe[0]; category = pipe[1].trim().toLowerCase().replace(/[^a-z-]/g, '') }
  const terms = termsPart
    .split(/[,\n]/)
    .map((s) => s.replace(/^[-\d.\s]+/, '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3)
  return { terms, category }
}

// La IA genera solo el título y el perfil adaptados (para rellenar tu plantilla Word).
export async function aiCvFields({ profile, job, language }) {
  const text = await askAI({ task: { kind: 'cvFields', job, language }, profile })
  const m = text.match(/\{[\s\S]*\}/)
  try {
    const o = JSON.parse(m ? m[0] : text)
    return { titulo: (o.titulo || '').trim(), perfil: (o.perfil || '').trim() }
  } catch {
    return { titulo: job.title || '', perfil: text.replace(/[{}"]/g, '').slice(0, 400).trim() }
  }
}

export async function askAI({ task, profile }) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, profile }),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Error ${res.status} en la IA`)
  return (await res.json()).text
}
