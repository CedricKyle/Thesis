const { Inventory } = require('../../../model/Index.js')

// GET all inventory items (not deleted)
const getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.findAll({ order: [['item_name', 'ASC']] })
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message })
  }
}

// GET single inventory item by item_code
const getInventoryByCode = async (req, res) => {
  try {
    const { item_code } = req.params
    const item = await Inventory.findOne({ where: { item_code } })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message })
  }
}

// CREATE new inventory item
const createInventoryItem = async (req, res) => {
  try {
    const { item_code, item_name, description, category, unit, quantity, reorder_point } = req.body
    const exists = await Inventory.findOne({ where: { item_code } })
    if (exists) return res.status(400).json({ message: 'Item code already exists' })

    const item = await Inventory.create({
      item_code,
      item_name,
      description,
      category,
      unit,
      quantity,
      reorder_point,
      last_received: null,
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: 'Error creating item', error: error.message })
  }
}

// UPDATE inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { item_code } = req.params
    const { item_name, description, category, unit, quantity, reorder_point } = req.body
    const item = await Inventory.findOne({ where: { item_code } })
    if (!item) return res.status(404).json({ message: 'Item not found' })

    await item.update({
      item_name,
      description,
      category,
      unit,
      quantity,
      reorder_point,
    })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message })
  }
}

// SOFT DELETE inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { item_code } = req.params
    const item = await Inventory.findOne({ where: { item_code } })
    if (!item) return res.status(404).json({ message: 'Item not found' })

    // Soft delete (paranoid: true)
    await item.destroy()
    res.json({ message: 'Item soft deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message })
  }
}

// RESTORE soft-deleted inventory item
const restoreInventoryItem = async (req, res) => {
  try {
    const { item_code } = req.params
    const item = await Inventory.findOne({ where: { item_code }, paranoid: false })
    if (!item) return res.status(404).json({ message: 'Item not found' })

    await item.restore()
    res.json({ message: 'Item restored' })
  } catch (error) {
    res.status(500).json({ message: 'Error restoring item', error: error.message })
  }
}

module.exports = {
  getAllInventory,
  getInventoryByCode,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restoreInventoryItem,
}
