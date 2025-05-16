const express = require('express')
const controller = require('../../../controller/main branch/Production Controller/production-batch-controller')
const router = express.Router()

// Get all production batches - FIXED PATH (move this to top)
router.get('/', controller.getProductionBatches)

// Get available raw materials from SCM
router.get('/raw-materials', controller.getAvailableRawMaterials)

// Get all finished goods
router.get('/finished-goods', controller.getFinishedGoods)

// Get all finished goods with their batch info
router.get('/finished-goods/with-batch', controller.getFinishedGoodsWithBatchInfo)

// Batch management
router.post('/', controller.createProductionBatch)

// Get batch by batch number
router.get('/batch-number/:batch_number', controller.getBatchByBatchNumber)

// Get batch details
router.get('/:id', controller.getBatchDetails)

// Update finished good's name and image
router.put('/finished-goods/:id', controller.updateFinishedGood)

// Soft delete a finished good
router.delete('/finished-goods/:id', controller.softDeleteFinishedGood)

// Restore a soft-deleted finished good
router.post('/finished-goods/:id/restore', controller.restoreFinishedGood)

module.exports = router
