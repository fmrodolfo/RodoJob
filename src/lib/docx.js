import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

// Rellena una plantilla .docx (con marcas {titulo}, {perfil}, ...) manteniendo el diseño.
export function fillDocxTemplate(base64, data, filename) {
  const zip = new PizZip(base64, { base64: true })
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '', // si una marca no tiene valor, la deja vacía en vez de fallar
  })
  doc.render(data)
  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'CV.docx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
