const express = require('express')
const router = express.Router()
const deductionController = require('../../controller/main branch/employee-deduction-controller.js')

// Get all active deductions
router.get('/', deductionController.getAllDeductions)

// Get all deductions including archived
router.get('/all', deductionController.getAllDeductionsWithArchived)

// Create a new deduction
router.post('/', deductionController.createDeduction)

// Update a deduction
router.put('/:id', deductionController.updateDeduction)

// Soft delete a deduction
router.delete('/:id', deductionController.deleteDeduction)

// Restore a soft-deleted deduction
router.post('/:id/restore', deductionController.restoreDeduction)

// Get deduction statistics
router.get('/stats', deductionController.getDeductionStats)

// Calculate deductions for a salary
router.get('/calculate', deductionController.calculateDeductionsForSalary)

module.exports = router
