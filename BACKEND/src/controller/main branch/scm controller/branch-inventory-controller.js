const { BranchInventory, Inventory, BranchDistributionRequest, BranchDistributionRequestItem, sequelize } = require('../../../model/Index.js')
const { Op } = require('sequelize')

const branchInventoryController = {
  // Get all inventory items from all branches
  async getAllBranchInventory(req, res) {
    try {
      console.log('Fetching all branch inventory items');
      let inventory = [];
      
      try {
        // Try with Sequelize model first
        inventory = await BranchInventory.findAll({
          order: [['branch_name', 'ASC'], ['item_name', 'ASC']]
        });
      } catch (modelError) {
        console.error('Error using Sequelize model:', modelError);
        
        // Fallback to direct query if model approach fails
        try {
          const [results] = await sequelize.query('SELECT * FROM branch_inventory');
          inventory = results;
          console.log('Retrieved data using direct SQL query');
        } catch (queryError) {
          console.error('Error with direct SQL query:', queryError);
          throw queryError; // Re-throw to be caught by outer catch
        }
      }

      console.log(`Found ${inventory.length} inventory items`);
      
      return res.json({
        success: true,
        data: inventory
      });
    } catch (error) {
      console.error('Error getting all branch inventory:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve branch inventory', 
        error: error.message 
      });
    }
  },

  // Get all inventory items for a specific branch
  async getBranchInventory(req, res) {
    try {
      const { branch_id } = req.params
      
      if (!branch_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Branch ID is required' 
        })
      }

      const inventory = await BranchInventory.findAll({
        where: { 
          branch_id
        },
        order: [['item_name', 'ASC']]
      })

      return res.json({
        success: true,
        data: inventory
      })
    } catch (error) {
      console.error('Error getting branch inventory:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve branch inventory', 
        error: error.message 
      })
    }
  },

  // Get a specific inventory item from a branch
  async getBranchInventoryItem(req, res) {
    try {
      const { branch_id, item_code } = req.params
      
      if (!branch_id || !item_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Branch ID and Item Code are required' 
        })
      }

      const item = await BranchInventory.findOne({
        where: { 
          branch_id,
          item_code
        },
        include: [{
          model: Inventory,
          as: 'inventoryItem',
          attributes: ['description', 'category', 'reorder_point']
        }]
      })

      if (!item) {
        return res.status(404).json({ 
          success: false, 
          message: 'Item not found in branch inventory' 
        })
      }

      return res.json({
        success: true,
        data: item
      })
    } catch (error) {
      console.error('Error getting branch inventory item:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve branch inventory item', 
        error: error.message 
      })
    }
  },

  // Update branch inventory based on distribution request
  async updateFromDistributionRequest(req, res) {
    try {
      const { request_id } = req.params
      
      if (!request_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Distribution Request ID is required' 
        })
      }

      // Get the distribution request with items
      const distributionRequest = await BranchDistributionRequest.findOne({
        where: { request_id },
        include: [{
          model: BranchDistributionRequestItem,
          as: 'items'
        }]
      })

      if (!distributionRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Distribution request not found' 
        })
      }

      // Check if request is fulfilled
      if (distributionRequest.status !== 'fulfilled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot update inventory from an unfulfilled request' 
        })
      }

      const branch_id = distributionRequest.branch_id
      const branch_name = distributionRequest.branch_name
      const items = distributionRequest.items

      // Update inventory for each item
      for (const item of items) {
        // Try to find existing inventory item
        let inventoryItem = await BranchInventory.findOne({
          where: {
            branch_id,
            item_code: item.product_code
          }
        })

        if (inventoryItem) {
          // Update existing item
          await inventoryItem.update({
            quantity: inventoryItem.quantity + item.fulfilled_quantity,
            last_updated: new Date(),
            last_distribution_id: request_id
          })
        } else {
          // Create new inventory item
          await BranchInventory.create({
            branch_id,
            branch_name,
            item_code: item.product_code,
            item_name: item.product_name,
            category: item.category || 'Others',
            quantity: item.fulfilled_quantity,
            unit: item.unit,
            last_distribution_id: request_id
          })
        }
      }

      return res.json({
        success: true,
        message: 'Branch inventory updated successfully from distribution request'
      })
    } catch (error) {
      console.error('Error updating branch inventory:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update branch inventory', 
        error: error.message 
      })
    }
  },

  // Get items with quantity below reorder point
  async getLowStockItems(req, res) {
    try {
      const { branch_id } = req.params
      
      if (!branch_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Branch ID is required' 
        })
      }

      // Find items where quantity is less than reorder_point
      const lowStockItems = await BranchInventory.findAll({
        where: { 
          branch_id,
          [Op.and]: [
            { quantity: { [Op.lt]: sequelize.col('reorder_point') } }
          ]
        },
        order: [['item_name', 'ASC']]
      })

      return res.json({
        success: true,
        data: lowStockItems
      })
    } catch (error) {
      console.error('Error getting low stock items:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve low stock items', 
        error: error.message 
      })
    }
  },

  // Manual update of branch inventory item
  async updateBranchInventoryItem(req, res) {
    try {
      const { branch_id, item_code } = req.params
      const { quantity, reorder_point, notes } = req.body
      
      if (!branch_id || !item_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Branch ID and Item Code are required' 
        })
      }

      const item = await BranchInventory.findOne({
        where: { 
          branch_id,
          item_code
        }
      })

      if (!item) {
        return res.status(404).json({ 
          success: false, 
          message: 'Item not found in branch inventory' 
        })
      }

      // Update the item
      const updateData = {}
      if (quantity !== undefined) updateData.quantity = quantity
      if (reorder_point !== undefined) updateData.reorder_point = reorder_point
      if (notes !== undefined) updateData.notes = notes
      
      updateData.last_updated = new Date()

      await item.update(updateData)

      return res.json({
        success: true,
        message: 'Branch inventory item updated successfully',
        data: item
      })
    } catch (error) {
      console.error('Error updating branch inventory item:', error)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update branch inventory item', 
        error: error.message 
      })
    }
  }
}

module.exports = branchInventoryController 