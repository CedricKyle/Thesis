// PH Withholding Tax Table (2024, Monthly)
function computePHWithholdingTax(monthlySalary) {
  if (monthlySalary <= 20833) return 0
  if (monthlySalary <= 33333) return (monthlySalary - 20833) * 0.2
  if (monthlySalary <= 66667) return 2500 + (monthlySalary - 33333) * 0.25
  if (monthlySalary <= 166667) return 10833.33 + (monthlySalary - 66667) * 0.3
  if (monthlySalary <= 666667) return 40833.33 + (monthlySalary - 166667) * 0.32
  return 200833.33 + (monthlySalary - 666667) * 0.35
}

module.exports = { computePHWithholdingTax }
