// Vercel Serverless Function: empresas reales por ciudad y sector (OpenStreetMap). Ruta: /api/companies
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

export default async function handler(req, res) {
  const where = (req.query?.where || '').trim()
  const sector = (req.query?.sector || 'restaurantes').toLowerCase()
  if (!where) return res.status(400).json({ error: 'Indica una ciudad.' })
  const filters = SECTOR_FILTERS[sector] || SECTOR_FILTERS.general

  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(where)}`
    const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': UA } })
    const geo = await geoRes.json()
    if (!geo || !geo.length) return res.status(200).json({ results: [], note: `No encontré la ubicación "${where}".` })
    const { lat, lon } = geo[0]

    const body = filters.map((f) => `node[${f}](around:9000,${lat},${lon});way[${f}](around:9000,${lat},${lon});`).join('')
    const query = `[out:json][timeout:25];(${body});out center 50;`

    // Varios servidores espejo de Overpass; si uno está saturado, se prueba el siguiente
    const ENDPOINTS = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ]
    let ov = null
    for (const ep of ENDPOINTS) {
      try {
        const ovRes = await fetch(ep, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: 'data=' + encodeURIComponent(query),
        })
        if (ovRes.ok) { ov = await ovRes.json(); break }
      } catch { /* probar el siguiente */ }
    }
    if (!ov) return res.status(502).json({ error: 'Los servidores de OpenStreetMap están ocupados ahora mismo. Espera un momento y vuelve a intentarlo.' })

    const seen = new Set()
    const results = []
    for (const el of (ov.elements || [])) {
      const t = el.tags || {}
      const name = t.name
      if (!name || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      const website = t.website || t['contact:website'] || ''
      const email = t.email || t['contact:email'] || ''
      results.push({
        name, sector, location: where,
        website: website || `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + where)}`,
        hasWebsite: Boolean(website), email,
      })
      if (results.length >= 30) break
    }
    return res.status(200).json({ results })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
