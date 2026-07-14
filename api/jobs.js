// Vercel Serverless Function: ofertas reales en Adzuna. Ruta: /api/jobs
const ADZUNA_COUNTRIES = ['gb', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'za']

export default async function handler(req, res) {
  const p = req.query || {}
  const what = p.what || ''
  const where = p.where || ''
  let country = (p.country || 'es').toLowerCase()
  const page = Math.max(1, parseInt(p.page || '1', 10))

  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return res.status(500).json({ error: 'Faltan ADZUNA_APP_ID / ADZUNA_APP_KEY en Vercel.' })
  if (!ADZUNA_COUNTRIES.includes(country)) country = 'gb'

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('results_per_page', '50')
  url.searchParams.set('content-type', 'application/json')
  if (what) url.searchParams.set('what', what)
  if (where) url.searchParams.set('where', where)
  const maxDays = p.max_days_old
  if (maxDays && /^\d+$/.test(maxDays)) url.searchParams.set('max_days_old', maxDays)
  if (p.category) url.searchParams.set('category', p.category)

  try {
    const r = await fetch(url.toString())
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: 'Adzuna: ' + t.slice(0, 200) }) }
    const data = await r.json()
    const results = (data.results || []).map((j) => ({
      id: String(j.id),
      title: j.title,
      company: j.company?.display_name || 'Empresa',
      location: j.location?.display_name || where,
      description: (j.description || '').replace(/<[^>]+>/g, ''),
      salary: j.salary_min ? `${Math.round(j.salary_min)}–${Math.round(j.salary_max || j.salary_min)}` : '',
      created: j.created,
      redirect_url: j.redirect_url,
      category: j.category?.label || '',
      latitude: j.latitude,
      longitude: j.longitude,
      area: j.location?.area || [],
    }))
    return res.status(200).json({ count: data.count || results.length, results })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
