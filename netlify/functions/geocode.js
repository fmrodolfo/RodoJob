// Función serverless: sugerencias de ciudades reales (autocompletar) vía OpenStreetMap Nominatim.
// Gratis y sin clave. Devuelve el nombre local de la ciudad (ej: "Genève", no "Ginebra").

const UA = 'RodoJob/1.0 (job search helper)'

export async function handler(event) {
  const q = (event.queryStringParameters?.q || '').trim()
  if (q.length < 2) return json(200, [])

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&featuretype=city&q=${encodeURIComponent(q)}`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) return json(200, [])
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
      out.push({ name, label: it.display_name })
      if (out.length >= 6) break
    }
    return json(200, out)
  } catch {
    return json(200, [])
  }
}

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
