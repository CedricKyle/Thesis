const express = require('express')
const controller = require('../../../controller/main branch/scm controller/inventory-receiving-controller.js')
const router = express.Router()

// Create a new receiving
router.post('/', controller.createReceiving)

// Get all receivings
router.get('/', controller.getAllReceivings)

// Get a single receiving by receiving_id
router.get('/:receiving_id', controller.getReceivingById)

module.exports = router
