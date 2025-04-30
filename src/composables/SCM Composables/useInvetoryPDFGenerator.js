import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ref } from 'vue'

export function useInventoryPDFGenerator() {
  const showExportModal = ref(false)
  const exportPageCount = ref(1) // default to 1, will update before export

  const generateInventoryPDF = async (products) => {
    const doc = new jsPDF()
    let currentY = 10

    // --- Add Logo (optional) ---
    const logoBase64 = await getBase64ImageFromUrl('/public/countryside-logo.png')
    doc.addImage(logoBase64, 'PNG', 14, currentY, 20, 20)
    currentY += 22

    // --- Title ---
    doc.setFontSize(18)
    doc.setTextColor(70, 97, 20)
    doc.text('Inventory Stock Monitoring', 14, currentY)
    currentY += 10

    // --- Table Section ---
    const headers = [
      'Product Name',
      'Quantity',
      'Max Qty',
      'Unit',
      'Date Created',
      'Expiry Date',
      'Category',
      'Status',
    ]
    const data = products.map((p) => [
      p.name,
      p.quantity,
      p.maxQuantity,
      p.unit,
      p.dateCreated || '-',
      p.expiryDate || '-',
      p.category,
      p.status,
    ])

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
      headStyles: {
        fillColor: [70, 97, 20],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto',
      setPageLimits: true,
      startX: 7.5,
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
    const fileName = `inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(fileName)
  }

  return { generateInventoryPDF }
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
