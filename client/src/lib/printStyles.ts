export function getProfessionalPrintStyles(dir: string = "rtl", textAlign: string = "right") {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: A4;
      margin: 15mm 12mm;
    }
    
    body {
      font-family: 'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif;
      padding: 0;
      direction: ${dir};
      color: #1a1a2e;
      font-size: 13px;
      line-height: 1.6;
      background: #fff;
    }

    .print-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #1a1a2e;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .print-header-logo {
      flex-shrink: 0;
    }

    .print-header-logo img {
      max-width: 140px;
      height: auto;
    }

    .print-header-info {
      text-align: ${textAlign === "right" ? "left" : "right"};
      flex-shrink: 0;
    }

    .print-header-info .company-name {
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    }

    .print-header-info .print-date {
      font-size: 11px;
      color: #888;
    }

    .print-title {
      text-align: center;
      margin-bottom: 8px;
    }

    .print-title h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
    }

    .print-title .subtitle {
      font-size: 14px;
      color: #555;
      margin-top: 4px;
    }

    .print-divider {
      height: 1px;
      background: linear-gradient(to ${textAlign === "right" ? "left" : "right"}, #1a1a2e, transparent);
      margin: 16px 0;
    }

    .info-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .info-row .info-item {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .info-row .info-label {
      color: #666;
      font-weight: 400;
    }

    .info-row .info-value {
      font-weight: 600;
      color: #1a1a2e;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 20px 0;
    }

    .summary-card {
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      padding: 14px 16px;
      background: #fafbfc;
      text-align: center;
    }

    .summary-card.highlight {
      border-color: #1a1a2e;
      background: #f0f1f5;
    }

    .summary-card.success {
      border-color: #27ae60;
      background: #f0faf4;
    }

    .summary-card.danger {
      border-color: #e74c3c;
      background: #fdf0ef;
    }

    .summary-label {
      font-size: 11px;
      color: #777;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .summary-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .summary-value.success { color: #1e8449; }
    .summary-value.danger { color: #c0392b; }
    .summary-value.income { color: #1e8449; }
    .summary-value.expense { color: #c0392b; }
    .summary-value .currency-label {
      font-size: 11px;
      font-weight: 400;
      color: #999;
      margin-${textAlign === "right" ? "right" : "left"}: 4px;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 16px 0;
      font-size: 12px;
    }

    thead th {
      background: #1a1a2e;
      color: #fff;
      font-weight: 600;
      padding: 10px 12px;
      text-align: ${textAlign};
      font-size: 12px;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    thead th:first-child {
      border-radius: ${dir === "rtl" ? "0 6px 0 0" : "6px 0 0 0"};
    }

    thead th:last-child {
      border-radius: ${dir === "rtl" ? "6px 0 0 0" : "0 6px 0 0"};
    }

    tbody td {
      padding: 9px 12px;
      border-bottom: 1px solid #eee;
      text-align: ${textAlign};
      color: #333;
    }

    tbody tr:nth-child(even) {
      background: #f8f9fb;
    }

    tbody tr:last-child td {
      border-bottom: 2px solid #1a1a2e;
    }

    tbody tr:last-child td:first-child {
      border-radius: ${dir === "rtl" ? "0 0 6px 0" : "0 0 0 6px"};
    }

    tbody tr:last-child td:last-child {
      border-radius: ${dir === "rtl" ? "0 0 0 6px" : "0 0 6px 0"};
    }

    .text-center { text-align: center; }

    .totals-section {
      margin-top: 20px;
      padding: 16px 20px;
      background: #f0f1f5;
      border-radius: 8px;
      border: 1.5px solid #d0d3dc;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 15px;
    }

    .total-row + .total-row {
      border-top: 1px solid #d0d3dc;
    }

    .total-row .total-label { 
      color: #555;
      font-weight: 500;
    }

    .total-row .total-amount {
      font-weight: 700;
      font-size: 17px;
      color: #1a1a2e;
    }

    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-received { background: #d4edda; color: #155724; }
    .badge-semi { background: #d1ecf1; color: #0c5460; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .badge-default { background: #e2e3e5; color: #383d41; }
    .badge-confirmed { background: #d4edda; color: #155724; }
    .badge-pending { background: #fff3cd; color: #856404; }

    .yes { color: #1e8449; font-weight: 700; }
    .no { color: #c0392b; font-weight: 700; }

    .remaining { color: #c0392b; }
    .paid { color: #27ae60; }
    .income { color: #27ae60; }
    .expense { color: #c0392b; }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 24px 0 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #eee;
    }

    .parts-table { margin: 8px 0; }
    .parts-table td, .parts-table th { padding: 5px 8px; font-size: 11px; }

    .print-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 2px solid #1a1a2e;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #999;
    }

    .print-footer .footer-left,
    .print-footer .footer-right {
      display: flex;
      gap: 16px;
    }

    .no-print { display: none !important; }

    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { background: #1a1a2e !important; color: #fff !important; }
      tbody tr:nth-child(even) { background: #f8f9fb !important; }
      .summary-card { background: #fafbfc !important; }
      .summary-card.highlight { background: #f0f1f5 !important; }
      .summary-card.success { background: #f0faf4 !important; }
      .summary-card.danger { background: #fdf0ef !important; }
      .totals-section { background: #f0f1f5 !important; }
      .badge-received { background: #d4edda !important; }
      .badge-semi { background: #d1ecf1 !important; }
      .badge-success { background: #d4edda !important; }
      .badge-danger { background: #f8d7da !important; }
      .badge-warning { background: #fff3cd !important; }
      .badge-info { background: #d1ecf1 !important; }
      .badge-default { background: #e2e3e5 !important; }
    }
  `;
}

export function generatePrintHeader(title: string, subtitle?: string, dir: string = "rtl") {
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const textAlign = dir === "rtl" ? "left" : "right";
  return `
    <div class="print-header">
      <div class="print-header-logo">
        <img src="/images/gnt-logo.png" alt="GNT" />
      </div>
      <div class="print-header-info" style="text-align: ${textAlign};">
        <div class="print-date">${dateStr}</div>
      </div>
    </div>
    <div class="print-title">
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    </div>
    <div class="print-divider"></div>
  `;
}

export function generatePrintFooter() {
  return `
    <div class="print-footer">
      <div class="footer-left">
        <span>GNT Trading</span>
      </div>
      <div class="footer-right">
        <span>${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  `;
}

export function openPrintWindow(options: {
  title: string;
  subtitle?: string;
  content: string;
  dir?: string;
  lang?: string;
}) {
  const { title, subtitle, content, dir = "rtl", lang = "ar" } = options;
  const textAlign = dir === "rtl" ? "right" : "left";
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${dir}" lang="${lang}">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>${getProfessionalPrintStyles(dir, textAlign)}</style>
    </head>
    <body>
      ${generatePrintHeader(title, subtitle, dir)}
      ${content}
      ${generatePrintFooter()}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}
