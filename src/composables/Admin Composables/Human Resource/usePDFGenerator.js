import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAttendanceLogic } from './useAttendanceLogic'

const logoUrl = '/public/countryside-logo.png'

export function usePDFGenerator() {
  const { calculateOvertime } = useAttendanceLogic()

  const generatePDF = async (
    formData,
    summary,
    records,
    departmentEmployeeSummaries = [],
    preview = false,
  ) => {
    try {
      const doc = new jsPDF()
      let currentY = 10

      // --- Add Countryside Logo ---
      const logoBase64 = await getBase64ImageFromUrl('/public/countryside-logo.png')
      doc.addImage(logoBase64, 'PNG', 14, currentY, 20, 20)
      currentY += 22

      // --- Title and Headers ---
      doc.setFontSize(20)
      doc.setTextColor(70, 97, 20)
      doc.text('Countryside Attendance Report', 40, currentY - 10)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(`Employee: ${formData.employeeName}`, 14, currentY + 5)
      doc.text(`Department: ${formData.department}`, 80, currentY + 5)
      doc.text(`Period: ${formData.startDate} to ${formData.endDate}`, 14, currentY + 13)
      currentY += 20

      // --- Summary Section ---
      let showSummary = false
      let summaryItems = []

      if (formData.department === 'ALL_DEPARTMENTS' || formData.employeeName === 'ALL') {
        // For all employees or specific department
        showSummary = true
        summaryItems = [
          { label: 'Total Present', value: summary?.Present ?? '-' },
          { label: 'Total Absent', value: summary?.Absent ?? '-' },
          { label: 'Total Late', value: summary?.Late ?? '-' },
        ]
      } else if (formData.department !== 'ALL_DEPARTMENTS' && formData.employeeName !== 'ALL') {
        // For specific employee
        showSummary = true
        summaryItems = [
          { label: 'Present Days', value: summary?.['Present Days'] ?? '-' },
          { label: 'Absent Days', value: summary?.['Absent Days'] ?? '-' },
          { label: 'Late Days', value: summary?.['Late Days'] ?? '-' },
          {
            label: 'Total Overtime',
            value:
              summary?.['Total Overtime'] !== undefined ? `${summary['Total Overtime']}h` : '-',
          },
        ]
      }

      if (showSummary) {
        doc.setFontSize(14)
        doc.setTextColor(70, 97, 20)
        doc.text('Summary', 14, currentY)
        doc.setTextColor(0, 0, 0)
        currentY += 8

        summaryItems.forEach((item, index) => {
          const x = 15 + index * 45
          doc.setDrawColor(70, 97, 20)
          doc.setFillColor(237, 247, 223)
          doc.rect(x, currentY, 40, 20, 'FD')
          doc.setFontSize(8)
          doc.setTextColor(70, 97, 20)
          doc.text(item.label, x + 2, currentY + 5)
          doc.setFontSize(12)
          doc.setTextColor(0, 0, 0)
          doc.text(item.value.toString(), x + 2, currentY + 15)
        })
        currentY += 30
      }

      // --- Per-Employee Leaderboard for Department ---
      if (formData.department !== 'ALL_DEPARTMENTS' && formData.employeeName === 'ALL') {
        doc.setFontSize(14)
        doc.setTextColor(70, 97, 20)
        doc.text('Per-Employee Attendance Summary', 14, currentY)
        doc.setTextColor(0, 0, 0)
        currentY += 8

        const safeFixed = (val) => {
          const num = Number(val)
          return isNaN(num) ? '0.00' : num.toFixed(2)
        }

        const leaderboardHeaders = [
          'Employee',
          'Present',
          'Late',
          'Absent',
          'On Leave',
          'Total Hours',
          'Avg Hours/Day',
        ]
        const leaderboardData = departmentEmployeeSummaries.map((emp) => [
          emp.name,
          emp.present,
          emp.late,
          emp.absent,
          emp.onLeave,
          safeFixed(emp.totalHours),
          safeFixed(emp.avgHours),
        ])

        autoTable(doc, {
          head: [leaderboardHeaders],
          body: leaderboardData,
          startY: currentY,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
          headStyles: {
            fillColor: [70, 97, 20],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto',
          setPageLimits: true,
          startX: 7.5,
        })
        currentY = doc.lastAutoTable.finalY + 10
      }

      // --- Table Section ---
      let headers, data
      if (formData.department === 'ALL_DEPARTMENTS') {
        // All Employees
        headers = ['Employee', 'Department', 'Date', 'Status']
        data = records.map((record) => [
          record.full_name || '-',
          record.department || '-',
          new Date(record.date).toLocaleDateString(),
          record.status || '-',
        ])
      } else if (formData.employeeName === 'ALL') {
        // Specific Department
        headers = ['Employee', 'Date', 'Status', 'Time In', 'Time Out', 'Working Hours', 'Overtime']
        data = records.map((record) => [
          record.full_name || '-',
          new Date(record.date).toLocaleDateString(),
          record.status || '-',
          record.signIn || '-',
          record.signOut || '-',
          record.workingHours || '-',
          calculateOvertime(record.signOut) > 0 ? `${calculateOvertime(record.signOut)}h` : '-',
        ])
      } else {
        // Specific Employee
        headers = ['Date', 'Time In', 'Time Out', 'Working Hours', 'Overtime', 'Status']
        data = records.map((record) => [
          new Date(record.date).toLocaleDateString(),
          record.signIn || '-',
          record.signOut || '-',
          record.workingHours || '-',
          calculateOvertime(record.signOut) > 0 ? `${calculateOvertime(record.signOut)}h` : '-',
          record.status || '-',
        ])
      }

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
          lineColor: [70, 97, 20],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [70, 97, 20],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        margin: { left: 15, right: 15 },
        tableWidth: 'auto',
        setPageLimits: true,
        startX: 7.5,
        didParseCell: function (data) {
          // Highlight status column
          if (
            (formData.department === 'ALL_DEPARTMENTS' && data.column.index === 3) ||
            (formData.employeeName === 'ALL' && data.column.index === 2) ||
            (formData.department !== 'ALL_DEPARTMENTS' &&
              formData.employeeName !== 'ALL' &&
              data.column.index === 5)
          ) {
            if (data.cell.raw === 'Present') {
              data.cell.styles.fillColor = [220, 252, 231]
              data.cell.styles.textColor = [34, 197, 94]
            } else if (data.cell.raw === 'Late') {
              data.cell.styles.fillColor = [254, 249, 195]
              data.cell.styles.textColor = [234, 179, 8]
            } else if (data.cell.raw === 'Absent') {
              data.cell.styles.fillColor = [254, 226, 226]
              data.cell.styles.textColor = [239, 68, 68]
            } else if (data.cell.raw === 'On Leave') {
              data.cell.styles.fillColor = [219, 234, 254]
              data.cell.styles.textColor = [59, 130, 246]
            }
          }
        },
      })

      // --- Page Numbers ---
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

      // --- Save PDF ---
      const fileName = `attendance_report_${(formData.employeeName || 'ALL').replace(/\s+/g, '_')}_${formData.startDate || 'start'}_${formData.endDate || 'end'}.pdf`
      if (preview) {
        // Return a blob URL for preview/print
        return doc.output('bloburl')
      } else {
        // Save as file
        doc.save(fileName)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  return { generatePDF }
}

async function getBase64ImageFromUrl(imageUrl) {
  const res = await fetch(imageUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
