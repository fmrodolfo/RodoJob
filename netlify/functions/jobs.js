// Función serverless: consulta ofertas reales en Adzuna (agrega Indeed y muchos portales).
// La app_id / app_key viven aquí, nunca en el navegador.

const ADZUNA_COUNTRIES = ['gb','us','at','au','be','br','ca','ch','de','es','fr','in','it','mx','nl','nz','pl','sg','za']

export async function handler(event) {
  const p = event.queryStringParameters || {}
  const what = p.what || ''
  const where = p.where || ''
  let country = (p.country || 'es').toLowerCase()
  const page = Math.max(1, parseInt(p.page || '1', 10))

  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    return json(500, { error: 'Faltan ADZUNA_APP_ID / ADZUNA_APP_KEY en Netlify.' })
  }
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
  const category = p.category
  if (category) url.searchParams.set('category', category)

  try {
    const r = await fetch(url.toString())
    if (!r.ok) {
      const t = await r.text()
      return json(r.status, { error: 'Adzuna: ' + t.slice(0, 200) })
    }
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
    return json(200, { count: data.count || results.length, results })
  } catch (e) {
    return json(500, { error: String(e.message || e) })
  }
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
