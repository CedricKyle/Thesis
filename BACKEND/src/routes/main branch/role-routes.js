const express = require('express')
const roleController = require('../../controller/main branch/role-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

// Protect all role routes with JWT authentication
// Get all roles
router.get('/', verifyToken, roleController.getAllRoles)

// Get role by name
router.get('/name/:roleName', verifyToken, roleController.getRoleByName)

// Create new role - typically only admin should have access
router.post('/', verifyToken, roleController.createRole)

// Update role - typically only admin should have access
router.put('/:id', verifyToken, roleController.updateRole)

// Delete role - typically only admin should have access
router.delete('/:id', verifyToken, roleController.deleteRole)

// Get role by ID
router.get('/:id', verifyToken, roleController.getRoleById)

// Add restore route
router.post('/:id/restore', verifyToken, roleController.restoreRole)

module.exports = router
