// Función serverless: busca EMPRESAS REALES por ciudad y sector usando OpenStreetMap.
// Usa Nominatim (geocodificación) + Overpass (puntos de interés). Ambos gratuitos y SIN clave.

const SECTOR_FILTERS = {
  restaurantes: ['"amenity"="restaurant"'],
  hoteles: ['"tourism"="hotel"', '"tourism"="hostel"', '"tourism"="guest_house"'],
  cafeterias: ['"amenity"="cafe"', '"amenity"="bar"', '"amenity"="pub"'],
  logistica: ['"office"="logistics"', '"industrial"="warehouse"', '"landuse"="industrial"'],
  retail: ['"shop"="mall"', '"shop"="department_store"', '"shop"="clothes"'],
  supermercados: ['"shop"="supermarket"'],
  salud: ['"amenity"="pharmacy"', '"amenity"="clinic"', '"healthcare"="centre"'],
  belleza: ['"shop"="hairdresser"', '"shop"="beauty"'],
  construccion: ['"craft"="builder"', '"office"="construction"'],
  general: ['"office"="company"', '"office"="commercial"'],
}
const UA = 'RodoJob/1.0 (job search helper)'

export async function handler(event) {
  const p = event.queryStringParameters || {}
  const where = (p.where || '').trim()
  const sector = (p.sector || 'restaurantes').toLowerCase()
  if (!where) return json(400, { error: 'Indica una ciudad.' })

  const filters = SECTOR_FILTERS[sector] || SECTOR_FILTERS.general

  try {
    // 1) Geocodificar la ciudad → lat/lon
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(where)}`
    const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': UA } })
    const geo = await geoRes.json()
    if (!geo || !geo.length) return json(200, { results: [], note: `No encontré la ubicación "${where}".` })
    const { lat, lon } = geo[0]

    // 2) Overpass: puntos de interés del sector alrededor de la ciudad (9 km)
    const body = filters.map((f) =>
      `node[${f}](around:9000,${lat},${lon});way[${f}](around:9000,${lat},${lon});`).join('')
    const query = `[out:json][timeout:25];(${body});out center 60;`
    const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      body: 'data=' + encodeURIComponent(query),
    })
    if (!ovRes.ok) return json(502, { error: 'No pude consultar OpenStreetMap ahora mismo. Inténtalo en un momento.' })
    const ov = await ovRes.json()

    const seen = new Set()
    const results = []
    for (const elArr of [ov.elements || []]) {
      for (const el of elArr) {
        const t = el.tags || {}
        const name = t.name
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        const website = t.website || t['contact:website'] || ''
        const email = t.email || t['contact:email'] || ''
        results.push({
          name,
          sector,
          location: where,
          website: website || `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + where)}`,
          hasWebsite: Boolean(website),
          email,
        })
        if (results.length >= 30) break
      }
    }
    return json(200, { results })
  } catch (e) {
    return json(500, { error: String(e.message || e) })
  }
}

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
