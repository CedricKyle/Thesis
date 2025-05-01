const { EmployeeDeduction } = require('../../model/Index.js')
const { Op } = require('sequelize')
const sequelize = require('sequelize')

// Validation helper
const validateDeductionData = async (data, id = null) => {
  const errors = []

  // Required fields validation
  const requiredFields = [
    'description',
    'deduction_type',
    'salary_range_from',
    'salary_range_to',
    'percentage_rate',
    'employer_share',
    'employee_share',
    'effective_date',
  ]

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`${field.replace('_', ' ')} is required`)
    }
  })

  // Percentage rate validation
  if (data.percentage_rate) {
    if (isNaN(data.percentage_rate) || data.percentage_rate <= 0) {
      errors.push('Percentage rate must be a positive number')
    }
    if (data.percentage_rate > 100) {
      errors.push('Percentage rate cannot exceed 100%')
    }
  }

  // Salary range validation
  if (data.salary_range_from && data.salary_range_to) {
    if (parseFloat(data.salary_range_from) >= parseFloat(data.salary_range_to)) {
      errors.push('Salary range from must be less than salary range to')
    }
  }

  // Share percentage validation
  if (data.employer_share && data.employee_share) {
    const totalShare = parseFloat(data.employer_share) + parseFloat(data.employee_share)
    if (totalShare !== parseFloat(data.percentage_rate)) {
      errors.push('Sum of employer and employee shares must equal the percentage rate')
    }
  }

  // Description validation
  if (data.description) {
    if (data.description.length < 3) {
      errors.push('Description must be at least 3 characters long')
    }
    if (data.description.length > 255) {
      errors.push('Description must not exceed 255 characters')
    }
  }

  // Date validation
  if (data.effective_date) {
    try {
      // Ensure the date is in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(data.effective_date)) {
        console.log('Invalid date format:', data.effective_date)
        errors.push('Effective date must be in YYYY-MM-DD format')
      }
    } catch (error) {
      console.log('Date validation error:', error)
      errors.push('Invalid effective date format')
    }
  }

  // Check for overlapping salary ranges for same deduction type
  if (data.salary_range_from && data.salary_range_to && data.deduction_type) {
    const overlapping = await EmployeeDeduction.findOne({
      where: {
        deduction_type: data.deduction_type,
        id: { [Op.ne]: id }, // Exclude current record when updating
        [Op.or]: [
          {
            salary_range_from: {
              [Op.between]: [data.salary_range_from, data.salary_range_to],
            },
          },
          {
            salary_range_to: {
              [Op.between]: [data.salary_range_from, data.salary_range_to],
            },
          },
        ],
        deleted_at: null,
      },
    })
    if (overlapping) {
      errors.push('Salary range overlaps with existing deduction of the same type')
    }
  }

  return errors
}

// Get all active deductions
const getActiveDeductions = async () => {
  const currentDate = new Date()
  return await EmployeeDeduction.findAll({
    where: {
      [Op.and]: [
        { effective_date: { [Op.lte]: currentDate } },
        {
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: currentDate } }],
        },
      ],
    },
  })
}

// Get all deductions with pagination and filters
exports.getAllDeductions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sort_by = 'created_at',
      sort_order = 'DESC',
      show_inactive = false,
      include_deleted = false,
      deduction_type,
    } = req.query

    console.log('Query params:', {
      page,
      limit,
      search,
      sort_by,
      sort_order,
      show_inactive,
      include_deleted,
      deduction_type,
    })

    const offset = (page - 1) * limit
    const currentDate = new Date()
    const where = {}

    // Search filter
    if (search) {
      where.description = { [Op.like]: `%${search}%` }
    }

    // Deduction type filter
    if (deduction_type) {
      where.deduction_type = deduction_type
    }

    // Active/Inactive filter
    if (!show_inactive) {
      where[Op.and] = [
        { effective_date: { [Op.lte]: currentDate } },
        {
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: currentDate } }],
        },
      ]
    }

    console.log('Where clause:', where)

    const deductions = await EmployeeDeduction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order]],
      paranoid: !include_deleted, // Set paranoid to false when include_deleted is true
    })

    console.log('Found deductions count:', deductions.count)
    console.log('Deductions data sample:', deductions.rows[0])

    // Add status to each deduction
    const deductionsWithStatus = deductions.rows.map((deduction) => {
      const isActive =
        deduction.effective_date <= currentDate &&
        (!deduction.end_date || deduction.end_date >= currentDate)

      const status = deduction.deleted_at ? 'Archived' : isActive ? 'Active' : 'Inactive'
      console.log('Processing deduction:', {
        id: deduction.id,
        status,
        deleted_at: deduction.deleted_at,
        effective_date: deduction.effective_date,
        end_date: deduction.end_date,
      })

      return {
        ...deduction.toJSON(),
        status,
        active_period: `${new Date(deduction.effective_date).toLocaleDateString()} - ${
          deduction.end_date ? new Date(deduction.end_date).toLocaleDateString() : 'Ongoing'
        }`,
      }
    })

    const response = {
      total: deductions.count,
      pages: Math.ceil(deductions.count / limit),
      current_page: parseInt(page),
      deductions: deductionsWithStatus,
    }

    console.log('Sending response:', response)
    res.json(response)
  } catch (error) {
    console.error('Error in getAllDeductions:', error)
    res.status(500).json({
      message: 'Error fetching deductions',
      error: error.message,
    })
  }
}

// Create new deduction
exports.createDeduction = async (req, res) => {
  try {
    const validationErrors = await validateDeductionData(req.body)
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors })
    }

    const deduction = await EmployeeDeduction.create({
      description: req.body.description,
      deduction_type: req.body.deduction_type,
      salary_range_from: req.body.salary_range_from,
      salary_range_to: req.body.salary_range_to,
      percentage_rate: req.body.percentage_rate,
      employer_share: req.body.employer_share,
      employee_share: req.body.employee_share,
      minimum_contribution: req.body.minimum_contribution,
      maximum_contribution: req.body.maximum_contribution,
      effective_date: req.body.effective_date,
      end_date: req.body.end_date || null,
    })

    res.status(201).json(deduction)
  } catch (error) {
    res.status(500).json({
      message: 'Error creating deduction',
      error: error.message,
    })
  }
}

// Update deduction
exports.updateDeduction = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Updating deduction:', id)
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('Effective date from request:', req.body.effective_date)

    const deduction = await EmployeeDeduction.findByPk(id)

    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' })
    }

    const validationErrors = await validateDeductionData(req.body, id)
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors)
      return res.status(400).json({ errors: validationErrors })
    }

    const updatedData = {
      description: req.body.description,
      deduction_type: req.body.deduction_type,
      salary_range_from: req.body.salary_range_from,
      salary_range_to: req.body.salary_range_to,
      percentage_rate: req.body.percentage_rate,
      employer_share: req.body.employer_share,
      employee_share: req.body.employee_share,
      minimum_contribution: req.body.minimum_contribution,
      maximum_contribution: req.body.maximum_contribution,
      effective_date: req.body.effective_date,
      end_date: req.body.end_date || null,
    }

    console.log('Updating with data:', updatedData)

    await deduction.update(updatedData)

    console.log('Update successful')
    res.json(deduction)
  } catch (error) {
    console.error('Error updating deduction:', error)
    res.status(500).json({
      message: 'Error updating deduction',
      error: error.message,
    })
  }
}

// Calculate deductions for a given salary
const calculateDeductionForSalary = async (salary) => {
  try {
    console.log('Finding active deductions for salary:', salary)

    const activeDeductions = await EmployeeDeduction.findAll({
      where: {
        [Op.and]: [
          { salary_range_from: { [Op.lte]: salary } },
          { salary_range_to: { [Op.gte]: salary } },
          { effective_date: { [Op.lte]: new Date() } },
          {
            [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
          },
        ],
      },
      order: [['deduction_type', 'ASC']],
    })

    console.log('Found active deductions:', activeDeductions.length)

    if (!activeDeductions || activeDeductions.length === 0) {
      return []
    }

    return activeDeductions.map((deduction) => {
      console.log('Processing deduction:', deduction.description)

      // First calculate the base contribution using percentage
      let contributionAmount = salary * (deduction.percentage_rate / 100)
      console.log('Initial contribution amount:', contributionAmount)

      // Store the original amount before applying min/max
      let originalAmount = contributionAmount

      // Check for minimum contribution only if it exists and is not null
      if (
        deduction.minimum_contribution !== null &&
        contributionAmount < deduction.minimum_contribution
      ) {
        console.log('Applying minimum contribution:', deduction.minimum_contribution)
        contributionAmount = parseFloat(deduction.minimum_contribution)
      }

      // Check for maximum contribution only if it exists and is not null
      if (
        deduction.maximum_contribution !== null &&
        contributionAmount > deduction.maximum_contribution
      ) {
        console.log('Applying maximum contribution:', deduction.maximum_contribution)
        contributionAmount = parseFloat(deduction.maximum_contribution)
      }

      // Calculate the employee and employer shares
      const employeeShareRatio = deduction.employee_share / deduction.percentage_rate
      const employerShareRatio = deduction.employer_share / deduction.percentage_rate

      // Calculate final shares based on the contribution amount and ensure they're numbers
      const employeeShare = parseFloat((contributionAmount * employeeShareRatio).toFixed(2))
      const employerShare = parseFloat((contributionAmount * employerShareRatio).toFixed(2))

      return {
        description: deduction.description,
        type: deduction.deduction_type,
        salary_range: `₱${parseFloat(deduction.salary_range_from).toLocaleString()} - ₱${parseFloat(deduction.salary_range_to).toLocaleString()}`,
        percentage_rate: `${deduction.percentage_rate}%`,
        total_contribution: parseFloat(contributionAmount.toFixed(2)),
        employee_share: employeeShare,
        employer_share: employerShare,
        details: `Based on monthly salary: ₱${parseFloat(salary).toLocaleString()}`,
        breakdown: {
          computation: `${parseFloat(salary).toLocaleString()} × ${deduction.percentage_rate}%`,
          minimum_applied:
            deduction.minimum_contribution !== null &&
            contributionAmount === parseFloat(deduction.minimum_contribution),
          maximum_applied:
            deduction.maximum_contribution !== null &&
            contributionAmount === parseFloat(deduction.maximum_contribution),
          original_calculation: parseFloat(originalAmount.toFixed(2)),
          adjusted_for_limits: contributionAmount !== originalAmount,
          minimum_contribution: deduction.minimum_contribution
            ? parseFloat(deduction.minimum_contribution)
            : null,
          maximum_contribution: deduction.maximum_contribution
            ? parseFloat(deduction.maximum_contribution)
            : null,
        },
      }
    })
  } catch (error) {
    console.error('Calculation error:', error)
    console.error('Error stack:', error.stack)
    throw error
  }
}

// Calculate deductions for salary endpoint
exports.calculateDeductionsForSalary = async (req, res) => {
  try {
    const { salary } = req.query

    // Add input validation logging
    console.log('Received salary query:', salary)
    console.log('Parsed salary value:', parseFloat(salary))

    if (!salary || isNaN(salary) || salary < 0) {
      return res.status(400).json({ message: 'Valid salary amount is required' })
    }

    const basicSalary = parseFloat(salary)
    console.log('Calculating deductions for salary:', basicSalary)

    // Add try-catch inside the main try block to catch calculation errors
    try {
      const deductions = await calculateDeductionForSalary(basicSalary)
      console.log('Calculated deductions:', JSON.stringify(deductions, null, 2))

      if (!deductions || deductions.length === 0) {
        return res.status(404).json({
          message: 'No applicable deductions found for this salary range',
        })
      }

      // Add validation for employee share calculation
      const totalEmployeeShare = parseFloat(
        deductions
          .reduce((sum, d) => {
            console.log('Processing deduction:', d.description, 'Employee share:', d.employee_share)
            return sum + d.employee_share
          }, 0)
          .toFixed(2),
      )

      console.log('Total employee share calculated:', totalEmployeeShare)

      const response = {
        basic_salary: basicSalary,
        calculation_date: new Date().toLocaleDateString(),
        deductions: deductions,
        total_employee_deductions: totalEmployeeShare,
        net_salary: parseFloat((basicSalary - totalEmployeeShare).toFixed(2)),
      }

      console.log('Sending response:', JSON.stringify(response, null, 2))
      res.json(response)
    } catch (calcError) {
      console.error('Error in deduction calculation:', calcError)
      throw new Error(`Calculation error: ${calcError.message}`)
    }
  } catch (error) {
    console.error('Error calculating deductions:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      message: 'Error calculating deductions',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// Add this function to the controller
exports.getAllDeductionsWithArchived = async (req, res) => {
  try {
    const deductions = await EmployeeDeduction.findAll({
      paranoid: false, // This will include soft-deleted records
      order: [['created_at', 'DESC']],
    })

    // Add status to each deduction
    const currentDate = new Date()
    const deductionsWithStatus = deductions.map((deduction) => {
      const isActive =
        deduction.effective_date <= currentDate &&
        (!deduction.end_date || deduction.end_date >= currentDate)
      const isDeleted = deduction.deleted_at !== null

      return {
        ...deduction.toJSON(),
        status: isDeleted ? 'Deleted' : isActive ? 'Active' : 'Inactive',
        active_period: `${new Date(deduction.effective_date).toLocaleDateString()} - ${
          deduction.end_date ? new Date(deduction.end_date).toLocaleDateString() : 'Ongoing'
        }`,
      }
    })

    res.json(deductionsWithStatus)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching archived deductions',
      error: error.message,
    })
  }
}

// Add restore function
exports.restoreDeduction = async (req, res) => {
  try {
    const { id } = req.params
    const deduction = await EmployeeDeduction.findByPk(id, { paranoid: false })

    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' })
    }

    if (!deduction.deleted_at) {
      return res.status(400).json({ message: 'Deduction is not deleted' })
    }

    // Check for overlapping salary ranges before restoring
    const overlapping = await EmployeeDeduction.findOne({
      where: {
        deduction_type: deduction.deduction_type,
        [Op.or]: [
          {
            salary_range_from: {
              [Op.between]: [deduction.salary_range_from, deduction.salary_range_to],
            },
          },
          {
            salary_range_to: {
              [Op.between]: [deduction.salary_range_from, deduction.salary_range_to],
            },
          },
        ],
        deleted_at: null,
      },
    })

    if (overlapping) {
      return res.status(400).json({
        message: 'Cannot restore: Salary range overlaps with existing deduction of the same type',
      })
    }

    await deduction.restore()
    res.json({
      message: 'Deduction restored successfully',
      deduction: deduction,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error restoring deduction',
      error: error.message,
    })
  }
}

// Add stats function
exports.getDeductionStats = async (req, res) => {
  try {
    const currentDate = new Date()
    const stats = {
      total_deductions: 0,
      active_deductions: 0,
      inactive_deductions: 0,
      deductions_by_type: {},
    }

    const deductions = await EmployeeDeduction.findAll({
      paranoid: false,
    })

    deductions.forEach((deduction) => {
      // Count total
      stats.total_deductions++

      // Count active/inactive
      const isActive =
        deduction.effective_date <= currentDate &&
        (!deduction.end_date || deduction.end_date >= currentDate) &&
        !deduction.deleted_at

      if (isActive) {
        stats.active_deductions++
      } else {
        stats.inactive_deductions++
      }

      // Count by type
      if (!stats.deductions_by_type[deduction.deduction_type]) {
        stats.deductions_by_type[deduction.deduction_type] = {
          total: 0,
          active: 0,
        }
      }
      stats.deductions_by_type[deduction.deduction_type].total++
      if (isActive) {
        stats.deductions_by_type[deduction.deduction_type].active++
      }
    })

    res.json(stats)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching deduction statistics',
      error: error.message,
    })
  }
}

// Add this function to the controller
exports.deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params
    const deduction = await EmployeeDeduction.findByPk(id)

    if (!deduction) {
      return res.status(404).json({ message: 'Deduction not found' })
    }

    // Soft delete the deduction
    await deduction.destroy()

    res.json({
      message: 'Deduction archived successfully',
      id: deduction.id,
      deleted_at: new Date(),
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting deduction',
      error: error.message,
    })
  }
}

// Export all functions
module.exports = {
  ...exports,
  getActiveDeductions,
}
