import { useState } from 'react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { QuoteRequest } from '@/lib/supabase-data';

interface CounterProposal {
  message: string;
  proposed_reach: number;
  proposed_impressions: number;
  proposed_clicks: number;
  proposed_budget: number;
  proposed_currency: string;
  proposed_start_date: string;
  proposed_end_date: string;
  conditions: string;
}

const formatCurrency = (amount: number, currency: string) => {
  const symbol = currency === 'EUR' ? '€' : currency === 'MXN' ? '$' : '$';
  return `${symbol}${amount.toLocaleString()} ${currency}`;
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export const useCounterProposalPDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async (quote: QuoteRequest, proposal: CounterProposal) => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      doc.setFillColor(139, 92, 246); // Primary purple color
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Contrapropuesta de Colaboración', pageWidth / 2, 25, { align: 'center' });
      
      y = 55;

      // Date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, margin, y);
      y += 15;

      // Section: Brand Info
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información de la Marca', margin, y);
      y += 8;

      doc.setDrawColor(139, 92, 246);
      doc.line(margin, y, margin + 60, y);
      y += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Marca: ${quote.brand_name}`, margin, y);
      y += 6;
      doc.text(`Email: ${quote.brand_email}`, margin, y);
      y += 6;
      doc.text(`Sitio Web: ${quote.brand_website_url}`, margin, y);
      y += 15;

      // Section: Original Request
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Solicitud Original', margin, y);
      y += 8;

      doc.setDrawColor(139, 92, 246);
      doc.line(margin, y, margin + 50, y);
      y += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const originalData = [
        ['Plataforma:', quote.platform === 'both' ? 'Instagram y TikTok' : quote.platform === 'instagram' ? 'Instagram' : 'TikTok'],
        ['Tipo de Contenido:', quote.campaign_type],
        ['Presupuesto:', formatCurrency(quote.budget || 0, quote.budget_currency || 'USD')],
        ['Alcance Esperado:', formatNumber(quote.expected_reach || 0)],
        ['Impresiones Esperadas:', formatNumber(quote.expected_impressions || 0)],
        ['Clicks Esperados:', formatNumber(quote.expected_clicks || 0)],
      ];

      originalData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 55, y);
        y += 6;
      });

      y += 10;

      // Section: Message
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Mensaje', margin, y);
      y += 8;

      doc.setDrawColor(139, 92, 246);
      doc.line(margin, y, margin + 30, y);
      y += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const messageLines = doc.splitTextToSize(proposal.message, contentWidth);
      doc.text(messageLines, margin, y);
      y += messageLines.length * 5 + 10;

      // Check if we need a new page
      if (y > 220) {
        doc.addPage();
        y = margin;
      }

      // Section: Counter Proposal
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Términos Propuestos', margin, y);
      y += 8;

      doc.setDrawColor(139, 92, 246);
      doc.line(margin, y, margin + 55, y);
      y += 8;

      // Proposal box
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
      
      y += 8;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);

      const proposalData = [
        ['Presupuesto Propuesto:', formatCurrency(proposal.proposed_budget, proposal.proposed_currency)],
        ['Alcance Propuesto:', formatNumber(proposal.proposed_reach)],
        ['Impresiones Propuestas:', formatNumber(proposal.proposed_impressions)],
        ['Clicks Propuestos:', formatNumber(proposal.proposed_clicks)],
      ];

      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2;
      
      proposalData.forEach(([label, value], index) => {
        const xPos = index % 2 === 0 ? col1X : col2X;
        const yOffset = Math.floor(index / 2) * 12;
        
        doc.setFont('helvetica', 'bold');
        doc.text(label, xPos, y + yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text(value, xPos + 45, y + yOffset);
      });

      y += 55;

      // Dates
      if (proposal.proposed_start_date || proposal.proposed_end_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Fechas:', margin, y);
        doc.setFont('helvetica', 'normal');
        const dateText = `${proposal.proposed_start_date ? format(new Date(proposal.proposed_start_date), "dd MMM yyyy", { locale: es }) : 'Por definir'} - ${proposal.proposed_end_date ? format(new Date(proposal.proposed_end_date), "dd MMM yyyy", { locale: es }) : 'Por definir'}`;
        doc.text(dateText, margin + 25, y);
        y += 15;
      }

      // Conditions
      if (proposal.conditions) {
        doc.setTextColor(139, 92, 246);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Condiciones', margin, y);
        y += 8;

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const conditionLines = doc.splitTextToSize(proposal.conditions, contentWidth);
        doc.text(conditionLines, margin, y);
        y += conditionLines.length * 4 + 10;
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFillColor(245, 243, 255);
      doc.rect(0, footerY - 10, pageWidth, 30, 'F');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text('Este documento es una propuesta preliminar. Responda a este email para confirmar o discutir los términos.', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Generado automáticamente | Yefer Showw Media Kit', pageWidth / 2, footerY + 6, { align: 'center' });

      // Save
      const fileName = `Contrapropuesta_${quote.brand_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);

    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating };
};
