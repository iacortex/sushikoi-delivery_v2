// src/features/cashup/print-utils.ts
export function printElement(el: HTMLElement, title = "Historial de turnos") {
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"; }
    body { padding: 16px; color: #111827; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .muted { color:#6b7280; font-size:12px }
    .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin-bottom:8px }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${el.outerHTML}
  <script>window.print(); setTimeout(()=>window.close(), 400);</script>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/**
 * Exporta un elemento DOM como PDF usando html2canvas + jsPDF.
 * Requiere: npm i html2canvas jspdf
 */
export async function exportElementToPDF(el: HTMLElement, filename = "historial-turnos.pdf", title = "Historial de turnos") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Canvas a partir del elemento
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  // Tamaño A4 (mm)
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calcular alto manteniendo proporción
  const imgWidth = pageWidth - 20; // márgenes
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Título
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title, 10, 12);

  let y = 18;

  // Si la imagen no cabe completa, la paginamos verticalmente
  let remaining = imgHeight;
  const srcHeight = canvas.height;
  const pageImgHeight = pageHeight - y - 10;
  const sliceHeightPx = (pageImgHeight * canvas.width) / imgWidth; // alto en px del canvas por página

  const ctx = canvas.getContext("2d")!;
  let offsetY = 0;

  while (remaining > 0) {
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.min(sliceHeightPx, srcHeight - offsetY);
    const sctx = slice.getContext("2d")!;
    // Copiar porciones del canvas
    sctx.drawImage(canvas, 0, offsetY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    const sliceImg = slice.toDataURL("image/png");
    const sliceImgHeight = (slice.height * imgWidth) / canvas.width;

    pdf.addImage(sliceImg, "PNG", 10, y, imgWidth, sliceImgHeight, undefined, "FAST");

    remaining -= sliceImgHeight;
    offsetY += slice.height;

    if (remaining > 0) {
      pdf.addPage();
      y = 10;
    }
  }

  pdf.save(filename);
}
