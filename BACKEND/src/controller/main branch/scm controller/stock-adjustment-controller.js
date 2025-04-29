const { StockAdjustment, InventoryProduct } = require('../../../model/Index')
const fs = require('fs')
const path = require('path')

exports.createStockAdjustment = async (req, res) => {
  try {
    const { product_id, new_quantity, reason, remarks, adjustment_type, user } = req.body
    const document = req.file ? req.file.path : null

    // 1. Product must exist
    const product = await InventoryProduct.findByPk(product_id)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })

    // 2. User must be provided
    if (!user) return res.status(400).json({ success: false, message: 'User is required.' })

    // 3. Adjustment type must be valid
    if (!['set', 'increase', 'decrease'].includes(adjustment_type))
      return res.status(400).json({ success: false, message: 'Invalid adjustment type.' })

    // 4. Reason must be provided
    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required.' })

    // 5. new_quantity must be a valid number
    if (isNaN(new_quantity))
      return res.status(400).json({ success: false, message: 'Quantity must be a number.' })

    const old_quantity = parseFloat(product.quantity)
    const qty = parseFloat(new_quantity)
    let final_quantity = old_quantity

    // 6. Validation and calculation per adjustment type
    if (adjustment_type === 'set') {
      if (qty < 0)
        return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' })
      final_quantity = qty
    } else if (adjustment_type === 'increase') {
      if (qty <= 0)
        return res
          .status(400)
          .json({ success: false, message: 'Increase amount must be positive.' })
      // Optional: check max_quantity
      if (product.max_quantity && old_quantity + qty > parseFloat(product.max_quantity)) {
        return res.status(400).json({ success: false, message: 'Exceeds max stock.' })
      }
      final_quantity = old_quantity + qty
    } else if (adjustment_type === 'decrease') {
      if (qty <= 0)
        return res
          .status(400)
          .json({ success: false, message: 'Decrease amount must be positive.' })
      if (old_quantity - qty < 0)
        return res
          .status(400)
          .json({ success: false, message: 'Resulting quantity cannot be negative.' })
      final_quantity = old_quantity - qty
    }

    // 7. Update product quantity
    await product.update({ quantity: final_quantity })

    // 8. Log adjustment
    const adjustment = await StockAdjustment.create({
      product_id,
      old_quantity,
      new_quantity: final_quantity,
      adjustment_type,
      reason,
      remarks,
      document,
      user,
    })

    res.json({ success: true, data: adjustment })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message })
  }
}

exports.getStockAdjustments = async (req, res) => {
  try {
    const adjustments = await StockAdjustment.findAll({
      where: { deleted_at: null },
      order: [['created_at', 'DESC']],
      include: [{ model: InventoryProduct, attributes: ['name', 'unit'] }],
    })
    res.json({ success: true, data: adjustments })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message })
  }
}

exports.softDeleteStockAdjustment = async (req, res) => {
  try {
    const { id } = req.params
    const adjustment = await StockAdjustment.findByPk(id)
    if (!adjustment)
      return res.status(404).json({ success: false, message: 'Adjustment not found.' })

    await adjustment.update({ deleted_at: new Date() })
    res.json({ success: true, message: 'Adjustment soft deleted.' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message })
  }
}

exports.restoreStockAdjustment = async (req, res) => {
  try {
    const { id } = req.params
    const adjustment = await StockAdjustment.findOne({
      where: { id },
      paranoid: false, // para makita pati soft deleted
    })
    if (!adjustment) return res.status(404).json({ success: false, message: 'Not found.' })

    await adjustment.update({ deleted_at: null })
    res.json({ success: true, message: 'Adjustment restored.', data: adjustment })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message })
  }
}
