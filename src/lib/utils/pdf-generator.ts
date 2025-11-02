import jsPDF from 'jspdf';

export type OrderPDFData = {
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  items: {
    productName: string;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
  }[];
  totalEstimatedCost: number;
  orderDate: string;
  restaurantName?: string;
  restaurantEmail?: string;
  restaurantPhone?: string;
};

/**
 * Generate a professional PDF order document
 */
export function generateOrderPDF(data: OrderPDFData): jsPDF {
  const doc = new jsPDF();

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header - Restaurant Info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (data.restaurantName) {
    doc.text(data.restaurantName, margin, yPos);
    yPos += 5;
  }
  if (data.restaurantEmail) {
    doc.text(data.restaurantEmail, margin, yPos);
    yPos += 5;
  }
  if (data.restaurantPhone) {
    doc.text(data.restaurantPhone, margin, yPos);
    yPos += 10;
  } else {
    yPos += 10;
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('BON DE COMMANDE', margin, yPos);
  yPos += 10;

  // Order Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${data.orderDate}`, margin, yPos);
  yPos += 15;

  // Supplier Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Fournisseur', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(data.supplierName, margin, yPos);
  yPos += 5;

  if (data.supplierEmail) {
    doc.text(data.supplierEmail, margin, yPos);
    yPos += 5;
  }
  if (data.supplierPhone) {
    doc.text(data.supplierPhone, margin, yPos);
    yPos += 5;
  }
  yPos += 10;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Produit', margin + 2, yPos + 5);
  doc.text('Quantité', pageWidth - margin - 60, yPos + 5);
  doc.text('Prix unit.', pageWidth - margin - 35, yPos + 5);
  doc.text('Total', pageWidth - margin - 15, yPos + 5, { align: 'right' });
  yPos += 10;

  // Table Rows
  doc.setFont(undefined, 'normal');
  data.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
    }

    // Product name
    doc.text(item.productName, margin + 2, yPos);

    // Quantity
    doc.text(`${item.quantity} ${item.unit}`, pageWidth - margin - 60, yPos);

    // Unit price
    if (item.estimatedPrice) {
      doc.text(`${item.estimatedPrice.toFixed(2)} €`, pageWidth - margin - 35, yPos);

      // Total
      const total = item.quantity * item.estimatedPrice;
      doc.text(`${total.toFixed(2)} €`, pageWidth - margin - 2, yPos, { align: 'right' });
    } else {
      doc.text('-', pageWidth - margin - 35, yPos);
      doc.text('-', pageWidth - margin - 2, yPos, { align: 'right' });
    }

    yPos += 7;
  });

  // Total Section
  if (data.totalEstimatedCost > 0) {
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 50, yPos, pageWidth - margin, yPos);
    yPos += 7;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL ESTIMÉ:', pageWidth - margin - 50, yPos);
    doc.text(`${data.totalEstimatedCost.toFixed(2)} €`, pageWidth - margin - 2, yPos, { align: 'right' });
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Document généré automatiquement par Cocorico', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

/**
 * Download PDF to user's computer
 */
export function downloadOrderPDF(data: OrderPDFData): void {
  const doc = generateOrderPDF(data);
  const filename = `commande-${data.supplierName.toLowerCase().replace(/\s+/g, '-')}-${data.orderDate}.pdf`;
  doc.save(filename);
}

/**
 * Get PDF as blob for email attachment
 */
export function getOrderPDFBlob(data: OrderPDFData): Blob {
  const doc = generateOrderPDF(data);
  return doc.output('blob');
}

/**
 * Get PDF as base64 string for email attachment
 */
export function getOrderPDFBase64(data: OrderPDFData): string {
  const doc = generateOrderPDF(data);
  return doc.output('datauristring').split(',')[1];
}
