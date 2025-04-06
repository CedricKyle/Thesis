import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function usePDFGenerator() {
  const generatePDF = (formData, reportSummary, attendanceReport) => {
    if (!reportSummary || !attendanceReport.length) return

    const doc = new jsPDF()

    // Add title and headers
    addDocumentHeader(doc, formData)

    // Add summary table
    addSummaryTable(doc, reportSummary)

    // Add detailed attendance table
    addAttendanceTable(doc, attendanceReport)

    // Add footer with page numbers
    addPageNumbers(doc)

    // Save the PDF
    const fileName = generateFileName(formData)
    doc.save(fileName)
  }

  // Helper function to add document header
  const addDocumentHeader = (doc, formData) => {
    doc.setFontSize(18)
    doc.text('Attendance Report', 14, 20)

    doc.setFontSize(12)
    doc.text(`Employee: ${formData.employeeName}`, 14, 30)
    doc.text(`Department: ${formData.department}`, 14, 37)
    doc.text(`Period: ${formData.startDate} to ${formData.endDate}`, 14, 44)

    doc.setFontSize(14)
    doc.text('Summary', 14, 55)
  }

  // Helper function to add summary table
  const addSummaryTable = (doc, reportSummary) => {
    const summaryData = Object.entries(reportSummary).map(([label, value]) => [label, value])

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [70, 97, 20] },
    })
  }

  // Helper function to add attendance table
  const addAttendanceTable = (doc, attendanceReport) => {
    doc.setFontSize(14)
    doc.text('Daily Attendance Details', 14, doc.lastAutoTable.finalY + 15)

    const tableData = attendanceReport.map((record) => [
      record.date,
      record.signIn || '-',
      record.signOut || '-',
      typeof record.workingHours === 'number' ? record.workingHours.toFixed(2) : '-',
      record.status,
    ])

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Time In', 'Time Out', 'Hours Worked', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [70, 97, 20] },
      styles: { fontSize: 10 },
      columnStyles: {
        4: {
          cellCallback: function (cell, opts) {
            switch (cell.raw) {
              case 'Present':
                cell.styles.textColor = [0, 128, 0]
                break
              case 'Absent':
                cell.styles.textColor = [255, 0, 0]
                break
              case 'Late':
                cell.styles.textColor = [255, 140, 0]
                break
            }
          },
        },
      },
    })
  }

  // Helper function to add page numbers
  const addPageNumbers = (doc) => {
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
  }

  // Helper function to generate filename
  const generateFileName = (formData) => {
    return `attendance_report_${formData.employeeName.replace(/\s+/g, '_')}_${formData.startDate}_${formData.endDate}.pdf`
  }

  return {
    generatePDF,
  }
}
