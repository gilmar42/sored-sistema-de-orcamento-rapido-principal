import type { Quote, Material, AppSettings, CalculatedCosts } from '../types';

// These are expected to be available in the global scope from the scripts in index.html
declare const jspdf: any;

// Fix: Redefined the interface to include all used methods from jspdf and jspdf-autotable
// This avoids the 'Cannot find namespace' error and subsequent property errors.
interface jsPDFWithAutoTable {
  autoTable: (options: any) => jsPDFWithAutoTable;
  addImage: (imageData: string, format: string, x: number, y: number, w: number, h: number) => jsPDFWithAutoTable;
  setFontSize: (size: number) => jsPDFWithAutoTable;
  text: (text: string, x: number, y: number) => jsPDFWithAutoTable;
  setFont: (fontName: string | undefined, fontStyle: string) => jsPDFWithAutoTable;
  save: (filename: string) => void;
  output: (type: string, options?: any) => string;
  lastAutoTable: { finalY: number };
}

export const generateQuotePDF = (quote: Quote, materials: Material[], settings: AppSettings, calculated: CalculatedCosts): Blob | string => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF() as jsPDFWithAutoTable;

  const getMaterialById = (id: string) => materials.find(m => m.id === id);

  // Header
  if (settings.companyLogo) {
    try {
        doc.addImage(settings.companyLogo, 'PNG', 15, 15, 30, 30);
    } catch (e) {
        console.error("Error adding logo image to PDF:", e);
    }
  }
  doc.setFontSize(20);
  doc.text(settings.companyName || 'Orçamento', 50, 25);
  doc.setFontSize(10);
  doc.text(settings.companyContact || '', 50, 32);

  // Quote Info
  doc.setFontSize(12);
  doc.text(`Orçamento Nº: ${quote.id}`, 15, 60);
  doc.text(`Data: ${new Date(quote.date).toLocaleDateString('pt-BR')}`, 15, 67);
  doc.text(`Cliente: ${quote.clientName || 'Não informado'}`, 15, 74);
  
  // Table
  const tableColumn = ["Descrição", "Qtd.", "Peso Unit. (kg)", "Peso Total (kg)", "Valor Total do Item (R$)"];
  const tableRows: any[] = [];

  quote.items.forEach(item => {
    const material = getMaterialById(item.materialId);
    if (material) {
      const itemCost = material.unitCost * item.quantity;
      const itemSellPrice = itemCost * (1 + (quote.profitMargin / 100)); // Simplified for itemization, real total uses more factors
      const totalItemWeight = material.unitWeight * item.quantity;

      const row = [
        material.name,
        item.quantity,
        material.unitWeight.toFixed(2),
        totalItemWeight.toFixed(2),
        (calculated.materialCost > 0 ? ((material.unitCost * item.quantity) / calculated.materialCost) * calculated.finalValue : 0).toFixed(2) // Pro-rata final value
      ];
      tableRows.push(row);
    }
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Updated primary color for dark theme branding
  });

  // Summary
  // Fix: Used the correctly typed `doc.lastAutoTable` property instead of casting to any.
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Resumo Final", 15, finalY);

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Peso Total Geral: ${calculated.totalWeight.toFixed(2)} kg`, 15, finalY + 10);
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(`Valor Total do Orçamento: R$ ${calculated.finalValue.toFixed(2)}`, 15, finalY + 20);

  // Components Table
  if (quote.items.length > 0) {
    let componentsStartY = finalY + 40; // Adjust starting Y for components table
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Componentes do Produto Final", 15, componentsStartY);

    const componentsTableColumn = ["Material", "Componente", "Tamanho", "Peso Unit.", "Custo Unit."];
    const componentsTableRows: any[] = [];

    quote.items.forEach(item => {
      const material = getMaterialById(item.materialId);
      if (material && material.components.length > 0) {
        material.components.forEach((component, compIndex) => {
          // Format component size similar to UI to avoid serializing objects directly
          const formatComponentSize = (comp: any) => {
            if (comp.sizeValue !== undefined && comp.sizeValue !== null) {
              if (typeof comp.sizeValue === 'string' || typeof comp.sizeValue === 'number') {
                return `${comp.sizeValue}${comp.sizeUnit ? ` ${comp.sizeUnit}` : ''}`;
              }
              if (typeof comp.sizeValue === 'object') {
                // Handle arrays specially: join readable elements
                if (Array.isArray(comp.sizeValue)) {
                  try {
                    // Try to stringify array elements gracefully
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { safeStringify } = require('../utils/safeStringify');
                    const mapped = comp.sizeValue.map((el: any) => {
                      if (el === null || typeof el === 'undefined') return null;
                      if (typeof el === 'string' || typeof el === 'number') return String(el);
                      try { return safeStringify(el); } catch { try { return String(el); } catch { return null; } }
                    }).filter(Boolean);
                    if (mapped.length > 0) return mapped.join(' / ');
                  } catch (e) {
                    // fallthrough to generic handling below
                  }
                }

                const parts: string[] = [];
                if (comp.sizeValue.lengthValue !== undefined && comp.sizeValue.lengthValue !== null) parts.push(`L: ${comp.sizeValue.lengthValue}${comp.sizeValue.lengthUnit ? ` ${comp.sizeValue.lengthUnit}` : ''}`);
                if (comp.sizeValue.diameterValue !== undefined && comp.sizeValue.diameterValue !== null) parts.push(`Ø: ${comp.sizeValue.diameterValue}${comp.sizeValue.diameterUnit ? ` ${comp.sizeValue.diameterUnit}` : ''}`);
                if (comp.sizeValue.widthValue !== undefined && comp.sizeValue.widthValue !== null) parts.push(`W: ${comp.sizeValue.widthValue}${comp.sizeValue.widthUnit ? ` ${comp.sizeValue.widthUnit}` : ''}`);
                if (parts.length > 0) return parts.join(' / ');

                try {
                  // If a migration produced a rawSizeString, use it
                  if (comp.rawSizeString) return comp.rawSizeString;

                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { safeStringify } = require('../utils/safeStringify');
                  const s = safeStringify(comp.sizeValue);
                  // If safeStringify returned something unhelpful, log the raw object for diagnosis and return '-'
                  if (typeof s === 'string' && (s === '[object Object]' || s.includes('[Circular]') || s.trim() === '' || s === 'null')) {
                    // eslint-disable-next-line no-console
                    console.warn('[DEBUG] pdfGenerator: unexpected comp.sizeValue shape:', comp.sizeValue);
                    return '-';
                  }
                  return s;
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('[DEBUG] pdfGenerator: safeStringify failed for comp.sizeValue:', err, comp.sizeValue);
                  try { return comp.rawSizeString ?? String(comp.sizeValue); } catch { return '-'; }
                }
              }
            }

            const parts: string[] = [];
            if (comp.lengthValue !== undefined && comp.lengthValue !== null) parts.push(`L: ${comp.lengthValue}${comp.lengthUnit ? ` ${comp.lengthUnit}` : ''}`);
            else if (comp.rawLengthInput) parts.push(`L: ${comp.rawLengthInput}${comp.lengthUnit ? ` ${comp.lengthUnit}` : ''}`);

            if (comp.diameterValue !== undefined && comp.diameterValue !== null) parts.push(`Ø: ${comp.diameterValue}${comp.diameterUnit ? ` ${comp.diameterUnit}` : ''}`);
            else if (comp.rawDiameterInput) parts.push(`Ø: ${comp.rawDiameterInput}${comp.diameterUnit ? ` ${comp.diameterUnit}` : ''}`);

            if (comp.widthValue !== undefined && comp.widthValue !== null) parts.push(`W: ${comp.widthValue}${comp.widthUnit ? ` ${comp.widthUnit}` : ''}`);
            else if (comp.rawWidthInput) parts.push(`W: ${comp.rawWidthInput}${comp.widthUnit ? ` ${comp.widthUnit}` : ''}`);

            if (parts.length > 0) return parts.join(' / ');

            return '-';
          };

          const row = [
            compIndex === 0 ? material.name : '',
            component.name,
            { text: formatComponentSize(component), alignment: 'left' },
            `${(component.unitWeight || 0).toFixed(2)} ${component.unit}`,
            `R$ ${(component.unitCost || 0).toFixed(2)}`
          ];
          componentsTableRows.push(row);
        });
      }
    });

    doc.autoTable({
      head: [componentsTableColumn],
      body: componentsTableRows,
      startY: componentsStartY + 10,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 0 && data.row.raw[0] !== '') {
          doc.setFont(undefined, 'bold');
        }
      },
    });
  }

  // Save PDF
  try {
    // Prefer returning a Blob so callers can create an object URL instead of a long data URI
    // jsPDF supports output('arraybuffer') which we can wrap in a Blob
    const arrayBuffer = doc.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    return blob;
  } catch (e) {
    // Fallback: return data URI string if blob/arraybuffer not available
    try {
      return doc.output('datauristring');
    } catch (err) {
      console.error('Failed to generate PDF (blob and datauri fallbacks failed):', err);
      throw err;
    }
  }
};