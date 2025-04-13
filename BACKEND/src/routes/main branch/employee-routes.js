const express = require('express')
const router = express.Router()
const employeeController = require('../../controller/main branch/employee-controller')

// Employee routes
router.post('/', employeeController.createEmployee)
router.get('/', employeeController.getAllEmployees)
router.get('/:id', employeeController.getAllEmployeeById)
router.put('/:id', employeeController.updateEmployee)
router.delete('/:id', employeeController.deleteEmployee)

module.exports = router
