import type { PrintTicket } from '@/types'
import qrcode from 'qrcode-generator'

function makeQrSvg(data: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(data)
  qr.make()
  return qr.createSvgTag(2, 0)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function slipHtml(ticket: PrintTicket, institutionName: string): string {
  const qrData = `${institutionName} | ${ticket.display_number} | powered by iki.ae`
  const qrSvg  = makeQrSvg(qrData)
  return `
    <div class="slip-page">
      <div class="slip-institution">${institutionName}</div>
      <div class="slip-session">${ticket.session_title}</div>
      <div class="slip-category">${ticket.category_prefix} — ${ticket.category_name}</div>
      <hr class="slip-divider" />
      <div class="slip-number">${ticket.display_number}</div>
      <hr class="slip-divider" />
      <div class="slip-issued">${formatDate(ticket.created_at)}</div>
      <div class="slip-qr">${qrSvg}</div>
      <div class="slip-watermark">powered by iki.ae</div>
    </div>
  `
}

const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 55mm 80mm; margin: 0; }
  body { background: #0a0a1a; min-height: 100vh;
         display: flex; flex-direction: column; align-items: center;
         justify-content: center; font-family: sans-serif; color: #fff; }
  #status { text-align: center; padding: 8mm; }
  #status .num { font-size: 40pt; font-weight: 900; color: #e08c2f; letter-spacing: 0.05em; }
  #status .msg { font-size: 11pt; opacity: 0.7; margin-top: 4mm; }
  #status .sub { font-size: 9pt; opacity: 0.4; margin-top: 2mm; }
  #back-btn {
    display: none; margin-top: 10mm; cursor: pointer;
    background: none; border: 1.5px solid rgba(255,255,255,0.25);
    border-radius: 10mm; padding: 3mm 6mm;
    color: #fff; font-size: 10pt; align-items: center; gap: 2mm;
  }
  #back-btn .arrow { font-size: 16pt; line-height: 1; }
  #back-btn .caption { font-size: 8pt; opacity: 0.5; display: block; margin-top: 1mm; text-align: center; }
  @media print { #back-btn { display: none !important; } }
  .slip-page {
    display: none;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8pt; color: #000; background: #fff;
  }
  .slip-institution { font-size: 8pt; font-weight: 700; text-align: center; margin-bottom: 1mm; line-height: 1.3; }
  .slip-session     { font-size: 6.5pt; text-align: center; line-height: 1.3; margin-bottom: 0.5mm; }
  .slip-category    { font-size: 6.5pt; text-align: center; line-height: 1.3; margin-bottom: 1mm; }
  .slip-divider     { border: none; border-top: 1px dashed #000; margin: 1mm 0; }
  .slip-number      { font-size: 24pt; font-weight: 900; text-align: center;
                      letter-spacing: 0.04em; padding: 1mm 0; line-height: 1.2; }
  .slip-issued      { font-size: 6.5pt; text-align: center; line-height: 1.3; margin-bottom: 1mm; }
  .slip-qr          { text-align: center; margin: 1mm 0; }
  .slip-qr svg      { width: 16mm; height: 16mm; }
  .slip-watermark   { font-size: 6pt; color: #555; text-align: center; line-height: 1.3; }
  @media print {
    html, body { background: #fff !important; display: block !important;
                 width: 100% !important; min-height: 0 !important; height: auto !important;
                 margin: 0 !important; padding: 0 !important; }
    #status, #back-btn { display: none !important; height: 0 !important; overflow: hidden !important; }
    .slip-page { display: block !important; width: 100% !important; padding: 0 !important; }
    .slip-page + .slip-page { page-break-before: always; }
  }
`

export interface SingleSlipData {
  display_number: string
  session_title: string
  category_prefix: string
  category_name: string
  created_at: string
}

function buildHtml(tickets: PrintTicket[], docTitle: string, institutionName: string): string {
  const firstNumber = tickets[0]?.display_number ?? docTitle
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div id="status">
    <div class="num">${firstNumber}</div>
    <div class="msg">Tiket sedang dicetak...</div>
    <div class="sub">Halaman akan kembali otomatis dalam 30 detik</div>
  </div>
  <button id="back-btn" onclick="window.location.replace(window.location.origin+'/kiosk')">
    <span class="arrow">&#8592;</span> Klik di sini
    <span class="caption">jika pilihan dan tombol cetak tidak muncul otomatis</span>
  </button>
  ${tickets.map(t => slipHtml(t, institutionName)).join('')}
  <script>
    function goKiosk() { window.location.replace(window.location.origin + '/kiosk'); }
    window.onload = function() {
      var btn = document.getElementById('back-btn');
      if (btn) btn.style.display = 'flex';
      window.print();
      var fallback = setTimeout(goKiosk, 30000);
      window.onafterprint = function() {
        clearTimeout(fallback);
        setTimeout(goKiosk, 5000);
      };
    };
  <\/script>
</body>
</html>`
}

export async function printSlips(tickets: PrintTicket[], docTitle: string, institutionName: string): Promise<void> {
  const html = buildHtml(tickets, docTitle, institutionName)
  document.open('text/html', 'replace')
  document.write(html)
  document.close()
}

export async function printSingleKiosk(data: SingleSlipData, institutionName: string): Promise<void> {
  const ticket: PrintTicket = {
    display_number:  data.display_number,
    number:          0,
    created_at:      data.created_at,
    session_title:   data.session_title,
    category_prefix: data.category_prefix,
    category_name:   data.category_name,
  }
  await printSlips([ticket], data.display_number, institutionName)
}
