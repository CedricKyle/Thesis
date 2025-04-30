const express = require('express')
const router = express.Router()
const positionController = require('../../controller/main branch/employee-position-controller.js')

// Get all active positions
router.get('/', positionController.getAllPositions)

// Get all positions including archived
router.get('/all', positionController.getAllPositionsWithArchived)

// Create a new position
router.post('/', positionController.createPosition)

// Update a position
router.put('/:id', positionController.updatePosition)

// Soft delete a position
router.delete('/:id', positionController.deletePosition)

// Restore a soft-deleted position
router.post('/:id/restore', positionController.restorePosition)

module.exports = router
