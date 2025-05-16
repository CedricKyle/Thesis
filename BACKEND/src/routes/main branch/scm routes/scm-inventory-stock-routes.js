const express = require('express')
const controller = require('../../../controller/main branch/scm controller/scm-inventory-stock-controller.js')
const router = express.Router()

// Stock In
router.post('/in', controller.createStockIn)
router.get('/in', controller.getAllStockIns)

// Stock Out
router.post('/out', controller.createStockOut)
router.get('/out', controller.getAllStockOuts)

module.exports = router
