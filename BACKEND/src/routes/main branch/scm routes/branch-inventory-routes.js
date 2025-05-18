const express = require('express')
const controller = require('../../../controller/main branch/scm controller/branch-inventory-controller.js')
const router = express.Router()

// Simple test endpoint to check connectivity
router.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    success: true, 
    message: 'Branch inventory API is working',
    timestamp: new Date().toISOString()
  });
});

// Get all inventory items from all branches
router.get('/', controller.getAllBranchInventory)

// Get all inventory items for a specific branch
router.get('/branch/:branch_id', controller.getBranchInventory)

// Get a specific inventory item from a branch
router.get('/branch/:branch_id/item/:item_code', controller.getBranchInventoryItem)

// Update branch inventory based on distribution request
router.post('/update-from-distribution/:request_id', controller.updateFromDistributionRequest)

// Get items with quantity below reorder point
router.get('/branch/:branch_id/low-stock', controller.getLowStockItems)

// Manual update of branch inventory item
router.put('/branch/:branch_id/item/:item_code', controller.updateBranchInventoryItem)

module.exports = router 