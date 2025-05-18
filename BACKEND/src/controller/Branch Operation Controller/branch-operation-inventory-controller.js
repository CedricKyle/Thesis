const { BranchOperationInventory } = require('../../model/Index.js')

const branchOperationInventoryController = {
  // Get all inventory items (optionally filter by branch)
  async getAll(req, res) {
    try {
      const { branch_id } = req.query
      const where = branch_id ? { branch_id } : {}
      const items = await BranchOperationInventory.findAll({ where })
      res.json({ success: true, data: items })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Get a single inventory item by branch_id and item_code
  async getOne(req, res) {
    try {
      const { branch_id, item_code } = req.params
      const item = await BranchOperationInventory.findOne({ where: { branch_id, item_code } })
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
      res.json({ success: true, data: item })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Create or update an inventory item
  async upsert(req, res) {
    try {
      const data = req.body
      const [item, created] = await BranchOperationInventory.upsert(data)
      res.json({ success: true, data: item, created })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Update an inventory item
  async update(req, res) {
    try {
      const { branch_id, item_code } = req.params
      const data = req.body
      const [updated] = await BranchOperationInventory.update(data, {
        where: { branch_id, item_code },
      })
      if (!updated) return res.status(404).json({ success: false, message: 'Item not found' })
      res.json({ success: true, message: 'Item updated' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Delete an inventory item
  async remove(req, res) {
    try {
      const { branch_id, item_code } = req.params
      const deleted = await BranchOperationInventory.destroy({ where: { branch_id, item_code } })
      if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' })
      res.json({ success: true, message: 'Item deleted' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },
}

module.exports = branchOperationInventoryController
