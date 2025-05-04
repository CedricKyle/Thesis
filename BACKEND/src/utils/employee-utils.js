const { Employee, Position } = require('../model/Index.js')

/**
 * Get the rate per hour for an employee by employee_id.
 * Returns 0 if not found.
 */
async function getEmployeeRatePerHour(employee_id) {
  const employee = await Employee.findOne({
    where: { employee_id, deleted_at: null },
    attributes: ['position_id'],
  })
  if (!employee) return 0
  const position = await Position.findOne({
    where: { id: employee.position_id },
    attributes: ['rate_per_hour'],
  })
  return position ? position.rate_per_hour : 0
}

module.exports = { getEmployeeRatePerHour }
