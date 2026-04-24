import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface PDFOptions {
  filename: string;
  backgroundColor?: string;
  ignoreElements?: (node: HTMLElement) => boolean;
}

export const generatePDF = async (element: HTMLElement, options: PDFOptions) => {
  try {
    const filter = (node: HTMLElement) => {
      if (node.dataset && node.dataset.html2canvasIgnore === 'true') {
        return false;
      }
      if (options.ignoreElements) {
        return options.ignoreElements(node);
      }
      return true;
    };

    const imgData = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: options.backgroundColor || '#ffffff',
      filter,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });

    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (img.height * pdfWidth) / img.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(options.filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
