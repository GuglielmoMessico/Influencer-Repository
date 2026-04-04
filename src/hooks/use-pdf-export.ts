import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { type Campaign } from '@/lib/data';

export const usePdfExport = () => {
  const exportToPDF = async (campaign: Campaign, mediaKitClicks: number) => {
    try {
      const element = document.getElementById('campaign-report-pdf');
      if (!element) {
        console.error('PDF template element not found');
        return;
      }

      // Store scroll position to restore later
      const scrollY = window.scrollY;
      
      // Make element visible for capture
      const originalStyle = element.style.cssText;
      element.style.cssText = `
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 800px !important;
        z-index: -1000 !important;
        visibility: visible !important;
        background: white !important;
      `;

      // Capture the element
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for professional print
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
      });

      // Restore style
      element.style.cssText = originalStyle;
      window.scrollTo(0, scrollY);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Center vertically if it fits on one page, or just start at top
      const yPos = 0;
      
      pdf.addImage(imgData, 'PNG', 0, yPos, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = `Reporte_${campaign.brand_name.replace(/\s+/g, '_')}_${campaign.campaign_code}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return { exportToPDF };
};
