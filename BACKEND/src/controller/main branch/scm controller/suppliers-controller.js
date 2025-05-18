const { Supplier } = require('../../../model/Index.js')
const { Op } = require('sequelize')

function isValidPHNumber(number) {
  // Accepts 09xxxxxxxxx or +639xxxxxxxxx (11 or 13 chars)
  return /^(\+639|09)\d{9}$/.test(number)
}

// Get all suppliers (optionally include archived)
const getAllSuppliers = async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true'
    let where = {}
    let paranoid = true

    if (showArchived) {
      // Only archived suppliers
      where.deleted_at = { [Op.not]: null }
      paranoid = false
    }

    const suppliers = await Supplier.findAll({
      where,
      paranoid,
      order: [['created_at', 'DESC']],
    })
    res.json({ success: true, data: suppliers })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const { full_name, contact_number, supply_type } = req.body

    if (!isValidPHNumber(contact_number)) {
      return res.status(400).json({ success: false, message: 'Invalid PH contact number format.' })
    }

    const supplier = await Supplier.create({ full_name, contact_number, supply_type })
    res.status(201).json({ success: true, data: supplier })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params
    const { contact_number } = req.body

    if (contact_number && !isValidPHNumber(contact_number)) {
      return res.status(400).json({ success: false, message: 'Invalid PH contact number format.' })
    }

    const [updated] = await Supplier.update(req.body, { where: { id } })
    if (!updated) return res.status(404).json({ success: false, message: 'Supplier not found' })
    const updatedSupplier = await Supplier.findByPk(id)
    res.json({ success: true, data: updatedSupplier })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Archive (soft delete) supplier
const archiveSupplier = async (req, res) => {
  try {
    const { id } = req.params
    const supplier = await Supplier.findByPk(id)
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' })
    await supplier.destroy()
    res.json({ success: true, message: 'Supplier archived', data: supplier })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Restore supplier
const restoreSupplier = async (req, res) => {
  try {
    const { id } = req.params
    const supplier = await Supplier.findOne({ where: { id }, paranoid: false })
    if (!supplier || !supplier.deletedAt)
      return res.status(404).json({ success: false, message: 'Supplier not found or not archived' })
    await supplier.restore()
    res.json({ success: true, message: 'Supplier restored', data: supplier })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  archiveSupplier,
  restoreSupplier,
}
