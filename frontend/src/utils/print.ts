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
    <div class="ticket-slip">
      <div class="slip-institution">${institutionName}</div>
      <div class="slip-session">${ticket.session_title}</div>
      <div class="slip-category">${ticket.category_prefix} — ${ticket.category_name}</div>
      <div class="slip-divider"></div>
      <div class="slip-number">${ticket.display_number}</div>
      <div class="slip-divider"></div>
      <div class="slip-issued">${formatDate(ticket.created_at)}</div>
      <div class="slip-divider"></div>
      <div class="slip-watermark">powered by iki.ae</div>
    </div>
  `
}

const SLIP_CSS = `
  .slip-page {
    width: 80mm;
    height: 120mm;
    padding: 5mm 4mm;
    font-family: 'Courier New', Courier, monospace;
    color: #000;
    background: #fff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
  .ticket-slip {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .slip-institution { font-size: 11pt; font-weight: 700; letter-spacing: 0.03em; text-align: center; }
  .slip-session     { font-size: 8pt; margin-top: 1mm; text-align: center; }
  .slip-category    { font-size: 8pt; margin-top: 0.5mm; text-align: center; }
  .slip-divider     { border-top: 1px dashed #000; margin: 2.5mm 0; }
  .slip-number      { text-align: center; font-size: 40pt; font-weight: 900; letter-spacing: 0.05em; line-height: 1; flex: 1; display: flex; align-items: center; justify-content: center; }
  .slip-issued      { text-align: center; font-size: 8pt; }
  .slip-watermark   { text-align: center; font-size: 7pt; color: #555; margin-top: 1.5mm; }
`

export interface SingleSlipData {
  display_number: string
  session_title: string
  category_prefix: string
  category_name: string
  created_at: string
}

export function printSlips(tickets: PrintTicket[], docTitle: string, institutionName: string): void {
  const area = document.getElementById('print-area')
  if (!area) return

  let style = document.getElementById('slip-print-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'slip-print-style'
    document.head.appendChild(style)
  }
  style.textContent = SLIP_CSS

  area.innerHTML = tickets.map(t =>
    `<div class="slip-page">${slipHtml(t, institutionName)}</div>`
  ).join('')

  const prev = document.title
  document.title = docTitle
  window.print()

  window.onafterprint = () => {
    document.title = prev
    area.innerHTML = ''
    window.onafterprint = null
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
