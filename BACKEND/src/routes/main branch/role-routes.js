const express = require('express')
const router = express.Router()
const roleController = require('../../controller/main branch/role-controller')

// Get all roles
router.get('/roles', roleController.getAllRoles)

// Get role by name
router.get('/roles/name/:roleName', roleController.getRoleByName)

// Create new role
router.post('/roles', roleController.createRole)

// Update role
router.put('/roles/:id', roleController.updateRole)

// Delete role
router.delete('/roles/:id', roleController.deleteRole)

// Get role by ID
router.get('/roles/:id', roleController.getRoleById)

module.exports = router
