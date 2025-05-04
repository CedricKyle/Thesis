import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ref } from 'vue'

export function useEmployeeSchedulePDFGenerator() {
  const showExportModal = ref(false)
  const exportPageCount = ref(1)

  const generateEmployeeSchedulePDF = async (schedules, action = 'save') => {
    const doc = new jsPDF()
    let currentY = 10

    // Add Logo
    const logoBase64 = await getBase64ImageFromUrl('/public/countryside-logo.png')
    doc.addImage(logoBase64, 'PNG', 14, currentY, 20, 20)
    currentY += 22

    // Title
    doc.setFontSize(18)
    doc.setTextColor(70, 97, 20)
    doc.text('Employee Schedule Management', 14, currentY)
    currentY += 10

    // Table Section
    const headers = [
      'Employee Name',
      'Department',
      'Type',
      'Start Time',
      'End Time',
      'Work Days',
      'Day Off',
      'Remarks',
    ]

    const data = schedules.map((s) => [
      s.employeeName,
      s.department,
      s.type,
      s.timeIn,
      s.timeOut,
      s.day || '-',
      s.dayOff || '-',
      s.remarks || '-',
    ])

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
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [70, 97, 20],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Employee Name
        1: { cellWidth: 25 }, // Department
        2: { cellWidth: 25 }, // Type
        3: { cellWidth: 20 }, // Start Time
        4: { cellWidth: 20 }, // End Time
        5: { cellWidth: 30 }, // Work Days
        6: { cellWidth: 20 }, // Day Off
        7: { cellWidth: 25 }, // Remarks
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto',
      setPageLimits: true,
      startX: 7.5,
    })

    // Add Page Numbers
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

    // Handle different actions
    if (action === 'save') {
      const fileName = `employee_schedules_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
    } else if (action === 'preview') {
      const pdfDataUri = doc.output('datauristring')
      window.open(pdfDataUri, '_blank')
    } else if (action === 'print') {
      doc.autoPrint()
      doc.output('dataurlnewwindow')
    }
  }

  return {
    generateEmployeeSchedulePDF,
    showExportModal,
    exportPageCount,
  }
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
