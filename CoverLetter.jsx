import { jsPDF } from 'jspdf'

const SKY = [14, 165, 233]
const INK = [23, 37, 52]
const MUTED = [110, 125, 140]

// Quita restos de markdown por si acaso
const clean = (t) => (t || '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/`/g, '')
const isHeading = (line) => {
  const l = line.trim()
  if (!l || l.length > 44 || l.startsWith('-') || l.startsWith('•')) return false
  const letters = l.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length < 3) return false
  return letters === letters.toUpperCase()
}

// ---------- CV profesional ----------
export function cvToPdf({ name, jobTitle, contact, body, photoDataUrl, filename }) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight()
  const m = 44
  const maxW = W - m * 2

  // Cabecera
  const headH = 96
  pdf.setFillColor(...SKY); pdf.rect(0, 0, W, headH, 'F')
  if (photoDataUrl) {
    try { pdf.addImage(photoDataUrl, 'JPEG', W - m - 60, 18, 60, 60, undefined, 'FAST') } catch { /* sin foto */ }
  }
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(23)
  pdf.text(clean(name || 'Currículum'), m, 44)
  if (jobTitle) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12); pdf.text(clean(jobTitle), m, 66) }
  if (contact) { pdf.setFontSize(9.5); pdf.text(clean(contact).slice(0, 110), m, 84) }

  // Cuerpo
  let y = headH + 26
  const lineH = 14.5
  pdf.setTextColor(...INK)

  const lines = clean(body).split('\n')
  for (let raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) { y += 7; continue }
    if (y > H - m) { pdf.addPage(); y = m }

    if (isHeading(line)) {
      y += 6
      if (y > H - m) { pdf.addPage(); y = m }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11.5); pdf.setTextColor(...SKY)
      pdf.text(line.trim().toUpperCase(), m, y)
      pdf.setDrawColor(190, 225, 245); pdf.setLineWidth(0.8)
      pdf.line(m, y + 4, W - m, y + 4)
      y += lineH + 4
      pdf.setTextColor(...INK)
      continue
    }

    const bullet = /^[-•]\s?/.test(line.trim())
    const text = line.trim().replace(/^[-•]\s?/, '')
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5)
    const indent = bullet ? m + 14 : m
    const wrapped = pdf.splitTextToSize(text, maxW - (bullet ? 14 : 0))
    wrapped.forEach((w, i) => {
      if (y > H - m) { pdf.addPage(); y = m }
      if (bullet && i === 0) {
        pdf.setFillColor(...SKY); pdf.circle(m + 4, y - 3, 1.7, 'F'); pdf.setTextColor(...INK)
      }
      pdf.text(w, indent, y)
      y += lineH
    })
  }

  pdf.setFontSize(8); pdf.setTextColor(...MUTED)
  pdf.text('Generado con RodoJob', m, H - 22)
  pdf.save(filename || 'CV.pdf')
}

// ---------- Carta de motivación ----------
export function letterToPdf({ name, subtitle, body, filename }) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight()
  const m = 52
  const maxW = W - m * 2

  pdf.setFillColor(...SKY); pdf.rect(0, 0, W, 70, 'F')
  pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(19)
  pdf.text('Carta de motivación', m, 34)
  if (subtitle) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11); pdf.text(clean(subtitle), m, 54) }

  pdf.setTextColor(...INK); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11)
  let y = 104; const lineH = 16
  clean(body).split('\n').forEach((para) => {
    if (para.trim() === '') { y += lineH * 0.6; return }
    pdf.splitTextToSize(para.trim(), maxW).forEach((l) => {
      if (y > H - m) { pdf.addPage(); y = m }
      pdf.text(l, m, y); y += lineH
    })
  })

  pdf.setFontSize(8); pdf.setTextColor(...MUTED)
  pdf.text('Generado con RodoJob', m, H - 24)
  pdf.save(filename || 'Carta.pdf')
}

// Compatibilidad: renderiza texto genérico como carta
export function textToPdf(opts) { return letterToPdf(opts) }
