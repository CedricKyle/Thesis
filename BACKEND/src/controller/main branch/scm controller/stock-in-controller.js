const { StockIn, InventoryProduct } = require('../../../model/Index.js')
const path = require('path')

const stockInController = {
  // List all stock ins
  async getAll(req, res) {
    const stockIns = await StockIn.findAll({ order: [['created_at', 'DESC']] })
    res.json({ success: true, data: stockIns })
  },

  // Create stock in
  async create(req, res) {
    const { product_id, quantity, unit, date, supplier, remarks } = req.body
    let document = null
    if (req.file) document = req.file.path

    // Update product quantity
    const product = await InventoryProduct.findOne({ where: { id: product_id, deleted_at: null } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    // VALIDATION
    if (Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' })
    }
    const newQty = Number(product.quantity) + Number(quantity)
    if (newQty > Number(product.max_quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds max quantity.' })
    }

    await product.update({ quantity: newQty })

    // Log stock in
    const stockIn = await StockIn.create({
      product_id,
      quantity,
      unit,
      date,
      supplier,
      remarks,
      document,
    })

    res.json({ success: true, data: stockIn })
  },
}

module.exports = stockInController
