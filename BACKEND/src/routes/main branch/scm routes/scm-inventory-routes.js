const express = require('express')
const controller = require('../../../controller/main branch/scm controller/scm-inventory-controller.js')
const router = express.Router()

router.get('/', controller.getAllInventory)
router.get('/:item_code', controller.getInventoryByCode)
router.post('/', controller.createInventoryItem)
router.put('/:item_code', controller.updateInventoryItem)
router.delete('/:item_code', controller.deleteInventoryItem)
router.post('/:item_code/restore', controller.restoreInventoryItem)

module.exports = router
