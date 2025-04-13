import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAttendanceLogic } from './useAttendanceLogic'

export function usePDFGenerator() {
  const { calculateOvertime } = useAttendanceLogic()

  const generatePDF = async (formData, summary, records) => {
    try {
      const doc = new jsPDF()
      let currentY = 10 // Start position for Y coordinate

      // Add title and headers
      doc.setFontSize(18)
      doc.text('Attendance Report', 14, currentY)
      currentY += 10

      doc.setFontSize(12)
      doc.text(`Employee: ${formData.employeeName}`, 14, currentY)
      currentY += 7
      doc.text(`Department: ${formData.department}`, 14, currentY)
      currentY += 7
      doc.text(`Period: ${formData.startDate} to ${formData.endDate}`, 14, currentY)
      currentY += 11

      doc.setFontSize(14)
      doc.text('Summary', 14, currentY)
      currentY += 10

      // Add summary boxes including overtime
      const summaryItems = [
        { label: 'Present Days', value: summary['Present Days'] },
        { label: 'Absent Days', value: summary['Absent Days'] },
        { label: 'Late Days', value: summary['Late Days'] },
        { label: 'Total Overtime', value: `${summary['Total Overtime']}h` },
      ]

      // Create summary boxes
      summaryItems.forEach((item, index) => {
        const x = 15 + index * 45 // Start at 15mm and space boxes 45mm apart
        doc.rect(x, currentY, 40, 20) // Keep box width at 40mm
        doc.setFontSize(8)
        doc.text(item.label, x + 2, currentY + 5)
        doc.setFontSize(12)
        doc.text(item.value.toString(), x + 2, currentY + 15)
      })
      currentY += 30 // Move down after summary boxes

      // Table headers and data
      const headers = ['Date', 'Time In', 'Time Out', 'Working Hours', 'Overtime', 'Status']

      const data = records.map((record) => [
        new Date(record.date).toLocaleDateString(),
        record.signIn || '-',
        record.signOut || '-',
        record.workingHours || '-',
        calculateOvertime(record.signOut) > 0 ? `${calculateOvertime(record.signOut)}h` : '-',
        record.status,
      ])

      // Generate table using jspdf-autotable
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Date
          1: { cellWidth: 25 }, // Time In
          2: { cellWidth: 25 }, // Time Out
          3: { cellWidth: 35 }, // Working Hours
          4: { cellWidth: 25 }, // Overtime
          5: { cellWidth: 30 }, // Status
        },
        headStyles: {
          fillColor: [70, 97, 20],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        margin: { left: 15, right: 15 }, // Add some margin
        tableWidth: 'auto', // Let it calculate automatically
        setPageLimits: true, // Ensure table fits on page
        startX: 7.5,
        didDrawCell: function (data) {
          if (data.section === 'body') {
            const cell = data.cell
            const col = data.column

            if (col.index === 4 && cell.raw !== '-') {
              // Overtime styling
              doc.setFillColor(237, 233, 254)
              doc.setTextColor(91, 33, 182)
            } else if (col.index === 5) {
              // Status styling
              const status = cell.raw
              if (status.includes('Present')) {
                doc.setTextColor(34, 197, 94)
              } else if (status.includes('Late')) {
                doc.setTextColor(234, 179, 8)
              } else if (status === 'Absent') {
                doc.setTextColor(239, 68, 68)
              }
            }
          }
        },
        willDrawCell: function (data) {
          if (data.section === 'body') {
            doc.setTextColor(0, 0, 0)
          }
        },
        didDrawPage: function (data) {
          doc.setTextColor(0, 0, 0)
        },
      })

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' },
        )
      }

      // Save the PDF
      const fileName = `attendance_report_${formData.employeeName.replace(/\s+/g, '_')}_${
        formData.startDate
      }_${formData.endDate}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  return {
    generatePDF,
  }
}
