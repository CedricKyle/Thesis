import express from 'express'
import * as employeeController from '../../controller/main branch/employee-controller.js'
import { upload } from '../../utils/main branch/fileHandler.js'
import { verifyToken } from '../../middleware/auth-middleware.js'

const router = express.Router()

// Public routes (no authentication needed)
router.post('/login', employeeController.login)
router.post('/logout', employeeController.logout)

// Protected routes (require authentication)
// Employee routes
router.get('/verify', verifyToken, employeeController.verifyToken)

// Use upload for profile image and resume uploads
router.post('/', verifyToken, upload, employeeController.createEmployee)

router.get('/', verifyToken, employeeController.getAllEmployees)
router.get('/:id', verifyToken, employeeController.getAllEmployeeById)

router.put('/:id', verifyToken, upload, employeeController.updateEmployee)

router.delete('/:id', verifyToken, employeeController.deleteEmployee)

// Add route for serving files - might want to protect this based on your requirements
router.get('/files/:type/:filename', verifyToken, employeeController.getFile)

export default router
