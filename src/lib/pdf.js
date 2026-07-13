import { jsPDF } from 'jspdf'

// Genera un PDF limpio con encabezado azul celeste a partir de texto.
export function textToPdf({ title, subtitle, body, filename }) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 48
  const maxW = pageW - margin * 2

  // Cabecera
  pdf.setFillColor(14, 165, 233)
  pdf.rect(0, 0, pageW, 70, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(title || 'Documento', margin, 34)
  if (subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text(subtitle, margin, 54)
  }

  // Cuerpo
  pdf.setTextColor(20, 30, 40)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  let y = 100
  const lineH = 16
  const paragraphs = (body || '').split('\n')
  for (const para of paragraphs) {
    if (para.trim() === '') { y += lineH * 0.6; continue }
    const lines = pdf.splitTextToSize(para, maxW)
    for (const line of lines) {
      if (y > pageH - margin) { pdf.addPage(); y = margin }
      pdf.text(line, margin, y)
      y += lineH
    }
  }

  // Pie
  pdf.setFontSize(8)
  pdf.setTextColor(150, 160, 170)
  pdf.text('Generado con RodoJob', margin, pageH - 24)

  pdf.save(filename || 'rodojob.pdf')
}
