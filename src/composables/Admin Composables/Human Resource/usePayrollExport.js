import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function usePayrollExport() {
  function downloadPayrollHistoryPDF(payrollHistory = [], statusMap) {
    if (!Array.isArray(payrollHistory)) payrollHistory = []
    const doc = new jsPDF('landscape')
    const headers = [
      [
        'No.',
        'Employee',
        'Month',
        'Quarter',
        'Week',
        'Start Date',
        'End Date',
        'Payroll Date',
        'Days Present',
        'Total Hours',
        'Reg. Pay',
        'OT Pay',
        'Deduction',
        'Net Pay',
        'Status',
      ],
    ]
    const data = payrollHistory.map((row, idx) => [
      idx + 1,
      row.employee?.full_name || row.employee_id,
      row.month,
      row.quarter,
      row.week,
      row.start_date,
      row.end_date,
      row.payroll_date,
      row.days_present,
      row.total_hours_worked,
      row.regular_hour_pay,
      row.overtime_pay,
      row.deduction,
      row.net_pay,
      statusMap[row.status]?.label || row.status,
    ])
    autoTable(doc, {
      head: headers,
      body: data,
      styles: { fontSize: 8 },
    })
    doc.save('payroll_history.pdf')
  }

  function printPayrollHistory(payrollHistory = [], statusMap) {
    if (!Array.isArray(payrollHistory)) payrollHistory = []
    const printWindow = window.open('', '', 'width=1200,height=800')
    let html = `
      <html>
        <head>
          <title>Payroll History</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 4px; }
          </style>
        </head>
        <body>
          <h2>Payroll History</h2>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Employee</th>
                <th>Month</th>
                <th>Quarter</th>
                <th>Week</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Payroll Date</th>
                <th>Days Present</th>
                <th>Total Hours Worked</th>
                <th>Regular Hour Pay</th>
                <th>Days Absent</th>
                <th>Absent Deduction</th>
                <th>Overtime Pay</th>
                <th>Tardiness Deduction</th>
                <th>Status</th>
                <th>Allowance</th>
                <th>Bonus</th>
                <th>Paid Holiday</th>
                <th>Deduction</th>
                <th>Gross Pay</th>
                <th>Salary Before Tax</th>
                <th>Net Pay</th>
                <th>Tax Deduction</th>
              </tr>
            </thead>
            <tbody>
              ${payrollHistory
                .map(
                  (row, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${row.employee?.full_name || row.employee_id}</td>
                  <td>${row.month}</td>
                  <td>${row.quarter}</td>
                  <td>${row.week}</td>
                  <td>${row.start_date}</td>
                  <td>${row.end_date}</td>
                  <td>${row.payroll_date}</td>
                  <td>${row.days_present}</td>
                  <td>${row.total_hours_worked}</td>
                  <td>${row.regular_hour_pay}</td>
                  <td>${row.days_absent}</td>
                  <td>${row.absent_deduction}</td>
                  <td>${row.overtime_pay}</td>
                  <td>${row.tardiness_deduction}</td>
                  <td>${statusMap[row.status]?.label || row.status}</td>
                  <td>${row.allowance}</td>
                  <td>${row.bonus}</td>
                  <td>${row.paid_holiday}</td>
                  <td>${row.deduction}</td>
                  <td>${row.gross_pay}</td>
                  <td>${row.salary_before_tax}</td>
                  <td>${row.net_pay}</td>
                  <td>${row.tax_deduction}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return {
    downloadPayrollHistoryPDF,
    printPayrollHistory,
  }
}
