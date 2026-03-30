import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { type Campaign } from '@/lib/data';

export const usePdfExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToPdf = useCallback(async (
    elementId: string,
    campaign: Campaign
  ) => {
    setExporting(true);
    toast.info('Generando PDF...', { duration: 2000 });

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento no encontrado');
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(139, 92, 246); // Primary color
      pdf.text(`Reporte de Campaña - ${campaign.brand_name}`, 15, 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Código: ${campaign.campaign_code}`, 15, 22);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 15, 27);

      // Add separator line
      pdf.setDrawColor(139, 92, 246);
      pdf.setLineWidth(0.5);
      pdf.line(15, 32, 195, 32);

      // Add metrics summary
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumen de Métricas', 15, 42);
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      const metricsY = 50;
      const col1 = 15;
      const col2 = 75;
      const col3 = 135;
      
      // Row 1
      pdf.text(`Alcance: ${campaign.metrics_reach.toLocaleString()}`, col1, metricsY);
      pdf.text(`Impresiones: ${campaign.metrics_impressions.toLocaleString()}`, col2, metricsY);
      pdf.text(`Clicks: ${campaign.metrics_clicks.toLocaleString()}`, col3, metricsY);
      
      // Row 2 - Calculate CTR and Engagement
      const ctr = campaign.metrics_impressions > 0 
        ? ((campaign.metrics_clicks / campaign.metrics_impressions) * 100).toFixed(2) 
        : '0.00';
      const engagement = campaign.metrics_reach > 0 
        ? ((campaign.metrics_clicks / campaign.metrics_reach) * 100).toFixed(2)
        : '0.00';
      
      pdf.text(`CTR: ${ctr}%`, col1, metricsY + 6);
      pdf.text(`Engagement: ${engagement}%`, col2, metricsY + 6);
      
      if (campaign.platform) {
        pdf.text(`Plataforma: ${campaign.platform}`, col3, metricsY + 6);
      }

      // Row 3 - Expectations comparison
      if (campaign.expected_reach && campaign.expected_reach > 0) {
        const reachDiff = (((campaign.metrics_reach - campaign.expected_reach) / campaign.expected_reach) * 100).toFixed(1);
        pdf.text(`vs Esperado: ${reachDiff}%`, col1, metricsY + 12);
      }
      
      if (campaign.expected_impressions && campaign.expected_impressions > 0) {
        const impDiff = (((campaign.metrics_impressions - campaign.expected_impressions) / campaign.expected_impressions) * 100).toFixed(1);
        pdf.text(`vs Esperado: ${impDiff}%`, col2, metricsY + 12);
      }
      
      if (campaign.expected_clicks && campaign.expected_clicks > 0) {
        const clickDiff = (((campaign.metrics_clicks - campaign.expected_clicks) / campaign.expected_clicks) * 100).toFixed(1);
        pdf.text(`vs Esperado: ${clickDiff}%`, col3, metricsY + 12);
      }

      // Add campaign details if available
      let detailsY = metricsY + 24;
      
      if (campaign.start_date || campaign.end_date || campaign.budget) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Detalles de Campaña', 15, detailsY);
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        detailsY += 8;
        
        if (campaign.start_date) {
          pdf.text(`Inicio: ${campaign.start_date}`, col1, detailsY);
        }
        if (campaign.end_date) {
          pdf.text(`Fin: ${campaign.end_date}`, col2, detailsY);
        }
        if (campaign.budget) {
          pdf.text(`Presupuesto: $${campaign.budget.toLocaleString()}`, col3, detailsY);
        }
        
        detailsY += 12;
      }

      // Add separator line before charts
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(15, detailsY, 195, detailsY);
      
      // Add the captured charts image
      let yPosition = detailsY + 5;
      let heightLeft = imgHeight;
      
      // If image fits on first page after header
      const firstPageSpace = pageHeight - yPosition - 10;
      
      if (imgHeight <= firstPageSpace) {
        pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      } else {
        // Multi-page handling
        let position = yPosition;
        
        // First page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position);
        
        // Add more pages if needed
        while (heightLeft > 0) {
          position = 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position - (imgHeight - heightLeft), imgWidth, imgHeight);
          heightLeft -= (pageHeight - 20);
        }
      }

      // Add footer on last page
      const pageCount = pdf.getNumberOfPages();
      pdf.setPage(pageCount);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Reporte generado automáticamente | Yefer Influencer Marketing', 105, pageHeight - 10, { align: 'center' });

      // Save the PDF
      const fileName = `Reporte_${campaign.brand_name.replace(/\s+/g, '_')}_${campaign.campaign_code}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('¡PDF descargado exitosamente!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportToPdf, exporting };
};
