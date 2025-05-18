const express = require('express')
const controller = require('../../controller/Branch Operation Controller/branch-operation-inventory-controller.js')
const router = express.Router()

// Get all inventory items (optionally filter by branch)
router.get('/', controller.getAll)

// Get a single inventory item
router.get('/:branch_id/:item_code', controller.getOne)

// Create or update (upsert) an inventory item
router.post('/', controller.upsert)

// Update an inventory item
router.put('/:branch_id/:item_code', controller.update)

// Delete an inventory item
router.delete('/:branch_id/:item_code', controller.remove)

module.exports = router
