const express = require('express')
const router = express.Router()
const rolesController = require('../controller/roles')

// Role routes
router.get('/:id', rolesController.getRoleById)
router.get('/', rolesController.getAllRoles)
router.post('/', rolesController.createRole)
router.put('/:id', rolesController.updateRole)
router.delete('/:id', rolesController.deleteRole)
router.get('/:id/users', rolesController.getRoleUsers)

module.exports = router
