import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function LessonPDFExporter({ lesson, courseTitle, moduleName }) {
  const printRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      // Clone the element to avoid modifying the visible DOM
      const element = printRef.current;
      
      // Create canvas with optimized settings
      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: true,
      });

      // Convert canvas to blob first to verify it's valid
      const blob = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Convert blob to data URL
      const imgData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Calculate image dimensions
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text(courseTitle || 'Course', margin, margin + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(moduleName || '', margin, margin + 10);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text(lesson?.title || 'Lesson', margin, margin + 15);
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + 18, pdfWidth - margin, margin + 18);
      
      // Add content image
      const contentStartY = margin + 22;
      let remainingHeight = imgHeight;
      let positionY = contentStartY;
      
      // First page
      if (imgHeight > pdfHeight - contentStartY - margin) {
        // Content spans multiple pages
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          positionY,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        
        // Add pages as needed
        while (remainingHeight > pdfHeight - contentStartY - margin) {
          pdf.addPage();
          remainingHeight -= (pdfHeight - contentStartY - margin);
          positionY -= (pdfHeight - contentStartY - margin);
        }
      } else {
        // Content fits on one page
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          positionY,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      }

      // Save the PDF
      const fileName = `${lesson?.title || 'lesson'}.pdf`
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 50);
      
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  return (
    <>
      {/* Download Button */}
      <button
        onClick={handleDownloadPDF}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download PDF
      </button>

      {/* Hidden content for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          ref={printRef}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            width: '800px',
            padding: '32px',
            lineHeight: '1.6',
          }}
        >
          {lesson?.objectives && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: '0 4px 4px 0' }}>
              <h4 style={{ fontWeight: 'bold', color: '#166534', marginBottom: '8px', fontSize: '16px', margin: '0 0 8px 0' }}>Learning Objectives</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: 0 }}>
                {lesson.objectives.map((obj, i) => (
                  <li key={i} style={{ color: '#15803d', marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            {lesson?.content?.map((block, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                {block.type === 'heading' && (
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginTop: '24px', marginBottom: '12px', margin: '24px 0 12px 0' }}>{block.text}</h2>
                )}
                
                {block.type === 'paragraph' && (
                  <p style={{ color: '#374151', lineHeight: '1.75', marginBottom: '16px', margin: '0 0 16px 0' }}>{block.text}</p>
                )}
                
                {block.type === 'list' && (
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '16px 0' }}>
                    {block.items.map((item, i) => (
                      <li key={i} style={{ color: '#374151', marginBottom: '8px' }}>{item}</li>
                    ))}
                  </ul>
                )}
                
                {block.type === 'code' && (
                  <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '16px', borderRadius: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px', whiteSpace: 'pre-wrap', margin: '16px 0', overflowX: 'auto' }}>
                    {block.text}
                  </div>
                )}
                
                {block.type === 'mcq' && (
                  <div style={{ backgroundColor: '#faf5ff', borderLeft: '4px solid #a855f7', padding: '16px', margin: '16px 0', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ fontWeight: 'bold', color: '#581c87', marginBottom: '12px', margin: '0 0 12px 0' }}>Quiz: {block.question}</p>
                    <div>
                      {block.options.map((option, i) => (
                        <p key={i} style={{ color: '#6b21a8', marginBottom: '8px', margin: '0 0 8px 0' }}>
                          <span style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + i)}.</span> {option}
                        </p>
                      ))}
                    </div>
                    <p style={{ marginTop: '12px', color: '#7e22ce', fontSize: '14px', margin: '12px 0 0 0' }}>
                      <span style={{ fontWeight: 'bold' }}>Answer:</span> {block.options[block.answer]}
                    </p>
                    <p style={{ color: '#9333ea', fontSize: '13px', marginTop: '4px', margin: '4px 0 0 0' }}>
                      <span style={{ fontWeight: 'bold' }}>Explanation:</span> {block.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {lesson?.resources && lesson.resources.length > 0 && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #d1d5db' }}>
              <h4 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '12px', margin: '0 0 12px 0' }}>Additional Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {lesson.resources.map((resource, i) => (
                  <li key={i} style={{ color: '#2563eb', marginBottom: '8px', wordBreak: 'break-all' }}>
                    📖 {resource.title}: {resource.url}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
