import { reportType } from '../report'

async function render(report, typeId, logo, out) {
  if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = (await import('buffer')).Buffer
  const lib = await import('@react-pdf/renderer')
  const { default: ReportDoc } = await import('./ReportPdf.jsx')
  const make = (pages, collect) => <ReportDoc report={report} typeId={typeId} logo={logo} pages={pages} collect={collect} />
  const collect = {}
  if (out === 'buffer') await lib.renderToBuffer(make({}, collect))
  else await lib.pdf(make({}, collect)).toBlob()
  const pages = { ...collect }
  return out === 'buffer' ? lib.renderToBuffer(make(pages, {})) : lib.pdf(make(pages, {})).toBlob()
}

export const renderReportBuffer = (report, typeId, logo) => render(report, typeId, logo, 'buffer')

export async function downloadReportPdf(report, typeId) {
  const logo = `${window.location.origin}/fyv-logo.png`
  const blob = await render(report, typeId, logo, 'blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.company.name.replace(/\W+/g, '-')}-${reportType(typeId).id}-report.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
