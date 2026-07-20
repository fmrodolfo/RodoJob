import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

// Rellena una plantilla .docx (con marcas {cuerpo}, {puesto}, ...) manteniendo el diseño.
export function fillDocxTemplate(base64, data, filename) {
  const zip = new PizZip(base64, { base64: true })

  // Comprobar que la plantilla tiene la marca {cuerpo}
  let xml = ''
  try { xml = zip.file('word/document.xml').asText() } catch { /* nada */ }
  if (!/cuerpo/i.test(xml)) {
    const e = new Error('Tu plantilla .docx no tiene la marca {cuerpo}. Ábrela en Word, borra el texto del cuerpo de la carta y escribe {cuerpo} en su lugar; luego vuelve a subirla en tu perfil.')
    e.code = 'SIN_MARCA'
    throw e
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '', // si una marca no tiene valor, la deja vacía
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
