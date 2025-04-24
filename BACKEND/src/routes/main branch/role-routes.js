const express = require('express')
const roleController = require('../../controller/main branch/role-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

// Protect all role routes with JWT authentication
// Get all roles
router.get('/roles', verifyToken, roleController.getAllRoles)

// Get role by name
router.get('/roles/name/:roleName', verifyToken, roleController.getRoleByName)

// Create new role - typically only admin should have access
router.post('/roles', verifyToken, roleController.createRole)

// Update role - typically only admin should have access
router.put('/roles/:id', verifyToken, roleController.updateRole)

// Delete role - typically only admin should have access
router.delete('/roles/:id', verifyToken, roleController.deleteRole)

// Get role by ID
router.get('/roles/:id', verifyToken, roleController.getRoleById)

module.exports = router
