const { StockOut, InventoryProduct } = require('../../../model/Index.js')
const path = require('path')

const stockOutController = {
  // List all stock outs
  async getAll(req, res) {
    const stockOuts = await StockOut.findAll({ order: [['created_at', 'DESC']] })
    res.json({ success: true, data: stockOuts })
  },

  // Create stock out
  async create(req, res) {
    const { product_id, quantity, unit, date, reason, remarks } = req.body
    let document = null
    if (req.file) document = req.file.path

    // Update product quantity
    const product = await InventoryProduct.findOne({ where: { id: product_id, deleted_at: null } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    // VALIDATION
    if (Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' })
    }
    if (Number(quantity) > Number(product.quantity)) {
      return res
        .status(400)
        .json({ success: false, message: 'Not enough stock for this operation.' })
    }

    const newQty = Number(product.quantity) - Number(quantity)
    await product.update({ quantity: newQty })

    // Log stock out
    const stockOut = await StockOut.create({
      product_id,
      quantity,
      unit,
      date,
      reason,
      remarks,
      document,
    })

    res.json({ success: true, data: stockOut })
  },
}

module.exports = stockOutController
