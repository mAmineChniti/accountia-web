import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'node:fs';

const doc = new jsPDF();

// Brand Header
doc.setFontSize(22);
doc.setTextColor(138, 34, 34); // Accountia Red
doc.text('Accountia Global', 14, 20);

doc.setFontSize(16);
doc.setTextColor(50);
doc.text('FACTURE #INV-2026-0606-011', 14, 30);

// Info
doc.setFontSize(10);
doc.setTextColor(100);
doc.text('Client: Hiba Khadraoui', 14, 40);
doc.text('Email: hkh304171@gmail.com', 14, 46);
doc.text("Date d'émission: 2026-05-01", 140, 40);
doc.text("Date d'échéance: 2026-05-15", 140, 46);

// Table
const tableColumn = ['Description', 'Quantité', 'Prix Unitaire', 'Total'];
const tableRows = [
  ['Ordinateur Portable - Haute Performance', 1, '2499.99 USD', '2499.99 USD'],
];

// @ts-expect-error - autoTable is added to jsPDF
doc.autoTable({
  head: [tableColumn],
  body: tableRows,
  startY: 60,
  headStyles: { fillColor: [138, 34, 34] },
});

// Total
// @ts-expect-error - lastAutoTable is added by jspdf-autotable
const finalY = doc.lastAutoTable.finalY;
doc.setFontSize(12);
doc.setTextColor(0);
doc.text('Total à payer : 2499.99 USD', 140, finalY + 15);

// Save to buffer and then to file
const buffer = doc.output('arraybuffer');
fs.writeFileSync('sample_invoice.pdf', Buffer.from(buffer));

console.log('PDF generated successfully as sample_invoice.pdf');
