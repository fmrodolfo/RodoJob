// Vercel Serverless Function: sugerencias de ciudades (OpenStreetMap). Ruta: /api/geocode
const UA = 'RodoJob/1.0 (job search helper)'

export default async function handler(req, res) {
  const q = (req.query?.q || '').trim()
  const country = (req.query?.country || '').trim().toLowerCase()
  if (q.length < 2) return res.status(200).json([])

  let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&limit=6&featuretype=city&q=${encodeURIComponent(q)}`
  if (country) url += `&countrycodes=${encodeURIComponent(country)}`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) return res.status(200).json([])
    const data = await r.json()
    const seen = new Set()
    const out = []
    for (const it of data) {
      const a = it.address || {}
      const name = a.city || a.town || a.village || a.municipality || a.county || (it.name || it.display_name.split(',')[0])
      if (!name) continue
      const key = name.toLowerCase() + '|' + (a.country || '')
      if (seen.has(key)) continue
      seen.add(key)
      const nd = it.namedetails || {}
      const aliases = [...new Set([
        name, nd.name, nd['name:fr'], nd['name:de'], nd['name:en'], nd['name:it'],
        a.city, a.town, a.state, a.county,
      ].filter((x) => x && x.length > 2))]
      out.push({ name, label: it.display_name, lat: parseFloat(it.lat), lon: parseFloat(it.lon), aliases })
      if (out.length >= 6) break
    }
    return res.status(200).json(out)
  } catch {
    return res.status(200).json([])
  }
}
