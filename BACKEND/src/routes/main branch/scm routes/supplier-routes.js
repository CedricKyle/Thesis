const express = require('express')
const supplierController = require('../../../controller/main branch/scm controller/suppliers-controller.js')
const { verifyToken } = require('../../../middleware/auth-middleware.js')

const router = express.Router()

router.get('/', verifyToken, supplierController.getAllSuppliers)
router.post('/', verifyToken, supplierController.createSupplier)
router.put('/:id', verifyToken, supplierController.updateSupplier)
router.delete('/:id', verifyToken, supplierController.archiveSupplier)
router.post('/:id/restore', verifyToken, supplierController.restoreSupplier)

module.exports = router
