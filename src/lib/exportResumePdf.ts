type ExportResumePdfOptions = {
  filename?: string;
};

export async function exportResumePdf(
  element: HTMLElement,
  { filename = 'Sidnei-Almeida-Resume.pdf' }: ExportResumePdfOptions = {},
): Promise<void> {
  await document.fonts.ready;

  const html2pdf = (await import('html2pdf.js')).default;

  await html2pdf()
    .set({
      margin: [15, 15, 15, 15],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (node: Element) => node.classList?.contains('no-print') ?? false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
}
