const { Inventory, InventoryStockIn, InventoryStockOut } = require('../../../model/Index.js')

// STOCK IN: Add stock and log
const createStockIn = async (req, res) => {
  try {
    const { item_code, quantity, unit, date, supplier, remarks, document } = req.body

    // Check if item exists
    const item = await Inventory.findOne({ where: { item_code } })
    if (!item) return res.status(404).json({ message: 'Item not found' })

    // Create stock in log
    const stockIn = await InventoryStockIn.create({
      item_code,
      quantity,
      unit,
      date,
      supplier,
      remarks,
      document,
    })

    // Update inventory quantity
    item.quantity = parseFloat(item.quantity) + parseFloat(quantity)
    item.last_received = new Date()
    await item.save()

    res.status(201).json({ message: 'Stock in recorded', stockIn, new_quantity: item.quantity })
  } catch (error) {
    res.status(500).json({ message: 'Error in stock in', error: error.message })
  }
}

// STOCK OUT: Remove stock and log
const createStockOut = async (req, res) => {
  try {
    const { item_code, quantity, unit, date, reason, remarks, document } = req.body

    // Check if item exists
    const item = await Inventory.findOne({ where: { item_code } })
    if (!item) return res.status(404).json({ message: 'Item not found' })

    // Check if enough stock
    if (parseFloat(item.quantity) < parseFloat(quantity)) {
      return res.status(400).json({ message: 'Not enough stock' })
    }

    // Create stock out log
    const stockOut = await InventoryStockOut.create({
      item_code,
      quantity,
      unit,
      date,
      reason,
      remarks,
      document,
    })

    // Update inventory quantity
    item.quantity = parseFloat(item.quantity) - parseFloat(quantity)
    await item.save()

    res.status(201).json({ message: 'Stock out recorded', stockOut, new_quantity: item.quantity })
  } catch (error) {
    res.status(500).json({ message: 'Error in stock out', error: error.message })
  }
}

// GET all stock ins
const getAllStockIns = async (req, res) => {
  try {
    const logs = await InventoryStockIn.findAll({ order: [['created_at', 'DESC']] })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock ins', error: error.message })
  }
}

// GET all stock outs
const getAllStockOuts = async (req, res) => {
  try {
    const logs = await InventoryStockOut.findAll({ order: [['created_at', 'DESC']] })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock outs', error: error.message })
  }
}

module.exports = {
  createStockIn,
  createStockOut,
  getAllStockIns,
  getAllStockOuts,
}
