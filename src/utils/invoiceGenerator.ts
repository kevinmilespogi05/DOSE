import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { formatPeso } from './currency';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}

// Helper function to format currency in PHP
const formatPHP = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const generateInvoice = async (data: InvoiceData): Promise<string> => {
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4'
  });
  
  const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `invoice-${data.invoiceNumber}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  // Company Name
  doc.font('Helvetica-Bold')
     .fontSize(28)
     .fillColor('#2563eb')
     .text('DOSE Pharmacy', { align: 'center' });

  // Decorative Line
  doc.moveDown(0.5);
  doc.lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke('#e5e7eb');

  // Invoice Box
  doc.moveDown(1);
  doc.rect(300, doc.y, 245, 80)
     .fillAndStroke('#f8fafc', '#e2e8f0');

  const invoiceBoxY = doc.y + 15;
  doc.font('Helvetica-Bold')
     .fontSize(20)
     .fillColor('#1e293b')
     .text('INVOICE', 320, invoiceBoxY);

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text(`Invoice Number: ${data.invoiceNumber}`, 320, invoiceBoxY + 25)
     .text(`Date: ${format(data.orderDate, 'MMMM d, yyyy')}`, 320, invoiceBoxY + 40);

  // Bill To Section
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor('#1e293b')
     .text('BILL TO:', 50, invoiceBoxY);

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text(data.customerEmail, 50, invoiceBoxY + 20);

  // Items Table
  doc.moveDown(5);
  const tableTop = doc.y;
  
  // Table Headers
  doc.rect(50, tableTop, 495, 20)
     .fill('#f1f5f9');

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#334155');

  doc.text('Item', 60, tableTop + 5);
  doc.text('Description', 180, tableTop + 5);
  doc.text('Qty', 350, tableTop + 5);
  doc.text('Price', 400, tableTop + 5);
  doc.text('Amount', 470, tableTop + 5);

  // Table Rows
  let y = tableTop + 25;
  data.items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.rect(50, y - 5, 495, 25)
         .fill('#fafafa');
    }

    const itemTotal = item.quantity * item.unit_price;

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#475569');

    doc.text(item.product_name, 60, y);
    doc.text(item.product_name, 180, y);
    doc.text(item.quantity.toString(), 350, y);
    doc.text(formatPeso(item.unit_price), 400, y);
    doc.text(formatPeso(itemTotal), 470, y);

    y += 25;
  });

  // Totals
  y += 20;
  const totalsX = 350;
  const valuesX = 470;

  // Subtotal
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text('Subtotal:', totalsX, y)
     .text(formatPeso(data.subtotal), valuesX, y);

  // Shipping
  y += 20;
  doc.text('Shipping:', totalsX, y)
     .text(formatPeso(data.shippingCost), valuesX, y);

  // Tax
  y += 20;
  doc.text('Tax:', totalsX, y)
     .text(formatPeso(data.taxAmount), valuesX, y);

  // Total
  y += 25;
  doc.rect(totalsX - 5, y - 5, 200, 25)
     .fill('#f1f5f9');

  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor('#1e293b')
     .text('Total:', totalsX, y)
     .text(formatPeso(data.totalAmount), valuesX, y);

  // Footer
  const footerY = doc.page.height - 100;
  doc.lineWidth(1)
     .moveTo(50, footerY)
     .lineTo(545, footerY)
     .stroke('#e2e8f0');

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text(
       'Thank you for choosing DOSE Pharmacy!\nFor any questions about this invoice, please contact support@dosepharmacy.com',
       50,
       footerY + 20,
       { align: 'center' }
     );

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}; 