const express = require('express')
const router = express.Router()
const employeeController = require('../../controller/main branch/employee-controller')
const { uploadProfile, uploadResume } = require('../../utils/main branch/fileHandler')

// Create a middleware for handling file uploads
const upload = require('multer')()

// Employee routes
router.post(
  '/',
  upload.fields([
    { name: 'employeeData', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  employeeController.createEmployee,
)

router.get('/', employeeController.getAllEmployees)
router.get('/:id', employeeController.getAllEmployeeById)
router.put('/:id', employeeController.updateEmployee)
router.delete('/:id', employeeController.deleteEmployee)

// Add route for serving files
router.get('/files/:type/:filename', employeeController.getFile)

module.exports = router
