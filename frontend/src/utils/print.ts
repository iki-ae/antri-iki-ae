import type { PrintTicket } from '@/types'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function slipHtml(ticket: PrintTicket, institutionName: string): string {
  return `
    <div class="slip-page">
      <div class="slip-institution">${institutionName}</div>
      <div class="slip-session">${ticket.session_title}</div>
      <div class="slip-category">${ticket.category_prefix} — ${ticket.category_name}</div>
      <hr class="slip-divider" />
      <div class="slip-number">${ticket.display_number}</div>
      <hr class="slip-divider" />
      <div class="slip-issued">${formatDate(ticket.created_at)}</div>
      <div class="slip-watermark">powered by iki.ae</div>
    </div>
  `
}

const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: 55mm auto; margin: 0; }

  body { background: #fff; width: 55mm; }

  .slip-page {
    font-family: 'Courier New', Courier, monospace;
    font-size: 8pt;
    color: #000;
    width: 55mm;
    padding: 3mm;
    page-break-after: always;
    break-after: page;
  }

  .slip-institution { font-size: 9pt; font-weight: 700; text-align: center; margin-bottom: 1mm; }
  .slip-session     { font-size: 7pt; text-align: center; }
  .slip-category    { font-size: 7pt; text-align: center; margin-bottom: 1mm; }
  .slip-divider     { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
  .slip-number      { font-size: 30pt; font-weight: 900; text-align: center; letter-spacing: 0.04em; padding: 3mm 0; }
  .slip-issued      { font-size: 7pt; text-align: center; margin-bottom: 1mm; }
  .slip-watermark   { font-size: 6pt; color: #555; text-align: center; }
`

export interface SingleSlipData {
  display_number: string
  session_title: string
  category_prefix: string
  category_name: string
  created_at: string
}

function buildHtml(tickets: PrintTicket[], docTitle: string, institutionName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${tickets.map(t => slipHtml(t, institutionName)).join('')}
</body>
</html>`
}

function printViaIframe(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()
  iframe.onload = () => {
    iframe.contentWindow!.print()
    // Remove after a short delay to allow the print dialog to initialise
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }
}

function printViaPopup(html: string, docTitle: string): void {
  const win = window.open('', '_blank', 'width=300,height=500')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
    win.onafterprint = () => win.close()
  }
}

export function printSlips(tickets: PrintTicket[], docTitle: string, institutionName: string): void {
  const html = buildHtml(tickets, docTitle, institutionName)
  const isMobile = navigator.maxTouchPoints > 0
  if (isMobile) {
    printViaIframe(html)
  } else {
    printViaPopup(html, docTitle)
  }
}

export function printSingleKiosk(data: SingleSlipData, institutionName: string): void {
  const ticket: PrintTicket = {
    display_number:  data.display_number,
    number:          0,
    created_at:      data.created_at,
    session_title:   data.session_title,
    category_prefix: data.category_prefix,
    category_name:   data.category_name,
  }
  printSlips([ticket], data.display_number, institutionName)
}
