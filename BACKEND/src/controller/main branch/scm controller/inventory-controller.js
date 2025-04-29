const { InventoryProduct, ProductPriceHistory } = require('../../../model/Index.js')
const path = require('path')
const { Op } = require('sequelize')

const inventoryController = {
  // List all products (not deleted)
  async getAll(req, res) {
    try {
      const { showArchived } = req.query
      let where = {}

      // If showArchived is false or not provided, only show non-deleted items
      if (!showArchived || showArchived === 'false') {
        where.deleted_at = null
      }

      const products = await InventoryProduct.findAll({ where })
      res.json({ success: true, data: products })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Get single product
  async getOne(req, res) {
    const { id } = req.params
    const product = await InventoryProduct.findOne({ where: { id, deleted_at: null } })
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: product })
  },

  // Create product
  async create(req, res) {
    const { name, category, unit, max_quantity, expiry_date, price, status } = req.body
    let image = null
    if (req.file) image = req.file.path
    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative.' })
    }
    const product = await InventoryProduct.create({
      name,
      category,
      unit,
      max_quantity,
      expiry_date,
      price,
      status,
      image,
    })
    res.json({ success: true, data: product })
  },

  // Update product
  async update(req, res) {
    const { id } = req.params
    const product = await InventoryProduct.findOne({ where: { id, deleted_at: null } })
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })

    const { name, category, unit, max_quantity, expiry_date, price, status, changed_by, reason } =
      req.body
    let image = product.image
    if (req.file) image = req.file.path

    // Price validation
    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative.' })
    }

    // Max quantity validation
    if (max_quantity !== undefined && Number(max_quantity) < Number(product.quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Max quantity cannot be less than current quantity.',
      })
    }

    // Check if price is changing
    if (price !== undefined && Number(price) !== Number(product.price)) {
      await ProductPriceHistory.create({
        product_id: product.id,
        old_price: product.price,
        new_price: price,
        changed_by: changed_by || 'System', // dapat galing sa req.body or session/user
        reason: reason || null,
      })
    }

    await product.update({ name, category, unit, max_quantity, expiry_date, price, status, image })
    res.json({ success: true, data: product })
  },

  // Soft delete
  async delete(req, res) {
    const { id } = req.params
    const product = await InventoryProduct.findOne({ where: { id, deleted_at: null } })
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    await product.update({ deleted_at: new Date() })
    res.json({ success: true, message: 'Product soft deleted' })
  },

  // Restore product
  async restore(req, res) {
    const { id } = req.params
    const product = await InventoryProduct.findOne({ where: { id, deleted_at: { [Op.ne]: null } } })
    if (!product)
      return res.status(404).json({ success: false, message: 'Not found or not deleted' })
    await product.update({ deleted_at: null })
    res.json({ success: true, message: 'Product restored', data: product })
  },

  // Get price history
  async getPriceHistory(req, res) {
    const { id } = req.params
    const history = await ProductPriceHistory.findAll({
      where: { product_id: id },
      order: [['changed_at', 'DESC']],
    })
    res.json({ success: true, data: history })
  },
}

module.exports = inventoryController
