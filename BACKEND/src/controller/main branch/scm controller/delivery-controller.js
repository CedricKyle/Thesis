const { Delivery, SCMRequest, Inventory, SCMRequestItem } = require('../../../model/Index')
const { Op } = require('sequelize')

// Get all deliveries (optionally filter by request_id)
exports.getAllDeliveries = async (req, res) => {
  const { request_id } = req.query
  const where = request_id ? { request_id } : {}
  const deliveries = await Delivery.findAll({ where, include: [SCMRequest] })
  res.json(deliveries)
}

// Create delivery (after request is released)
exports.createDelivery = async (req, res) => {
  const { request_id, supplier, items, delivery_date } = req.body
  // Optionally: check if request is released
  const request = await SCMRequest.findOne({ where: { request_id, payment_status: 'Released' } })
  if (!request) return res.status(400).json({ message: 'Request not released or not found' })
  const delivery = await Delivery.create({ request_id, supplier, items, delivery_date })
  res.status(201).json(delivery)
}

// Helper: Map supply_type to Inventory.category ENUM
function mapSupplyTypeToCategory(supplyType) {
  if (!supplyType) return 'Others'
  const normalized = supplyType.trim().toLowerCase()
  if (normalized.includes('food') || normalized.includes('ingredient')) return 'Food Ingredients'
  if (normalized.includes('office')) return 'Office Supplies'
  if (normalized.includes('kitchen')) return 'Kitchen Equipment'
  if (normalized.includes('clean')) return 'Cleaning Supplies'
  if (normalized.includes('service')) return 'Service Equipment'
  if (normalized.includes('raw')) return 'Raw Materials'
  if (normalized.includes('pack')) return 'Packaging Materials'
  return 'Others'
}

// Helper: Generate consistent item code
async function generateItemCode(category) {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const catMap = {
    'Food Ingredients': 'FOO',
    'Office Supplies': 'OFF',
    'Kitchen Equipment': 'KIT',
    'Cleaning Supplies': 'CLE',
    'Service Equipment': 'SER',
    'Raw Materials': 'RAW',
    'Packaging Materials': 'PAC',
    Others: 'OTH',
  }
  const catCode = catMap[category] || 'OTH'
  // Count existing items for this category and month
  const count = await Inventory.count({
    where: {
      category,
      created_at: {
        [Op.gte]: new Date(
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        ),
      },
    },
  })
  return `${catCode}-${yearMonth}-${String(count + 1).padStart(4, '0')}`
}

// Mark as received and auto-update inventory
exports.receiveDelivery = async (req, res) => {
  const { id } = req.params
  const { received_by, receipt_url } = req.body
  const delivery = await Delivery.findByPk(id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  delivery.status = 'Received'
  delivery.received_by = received_by
  delivery.received_at = new Date()
  delivery.receipt_url = receipt_url || null
  await delivery.save()

  // --- AUTO-UPDATE INVENTORY ---
  let items = delivery.items
  if (typeof items === 'string') items = JSON.parse(items)
  for (const item of items) {
    // If user selected "Restock" and provided item_code, always restock
    if (item.stockStatus === 'Restock' && item.selectedItemCode) {
      let inv = await Inventory.findOne({ where: { item_code: item.selectedItemCode } })
      if (inv) {
        inv.quantity = parseFloat(inv.quantity) + parseFloat(item.quantity)
        inv.last_received = new Date()
        await inv.save()
        continue
      }
    }

    // If "New Stock", check if item name already exists
    let existingByName = await Inventory.findOne({ where: { item_name: item.item_name } })
    if (item.stockStatus === 'New Stock' && existingByName) {
      // Auto-restock (Option 2)
      existingByName.quantity = parseFloat(existingByName.quantity) + parseFloat(item.quantity)
      existingByName.last_received = new Date()
      await existingByName.save()
      continue
    }

    // Otherwise, create new inventory record
    await Inventory.create({
      item_code: item.item_code, // or generate if needed
      item_name: item.item_name,
      category: item.selectedCategory,
      quantity: item.quantity,
      unit: item.unit,
      reorder_point: 0,
      last_received: new Date(),
    })
  }
  // --- END AUTO-UPDATE ---

  res.json({ message: 'Delivery received', delivery })
}

// Cancel delivery
exports.cancelDelivery = async (req, res) => {
  const { id } = req.params
  const { canceled_by, cancel_reason } = req.body
  const delivery = await Delivery.findByPk(id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  delivery.status = 'Canceled'
  delivery.canceled_by = canceled_by
  delivery.canceled_at = new Date()
  delivery.cancel_reason = cancel_reason
  await delivery.save()
  res.json({ message: 'Delivery canceled', delivery })
}

// Update delivery details (before receiving)
exports.updateDelivery = async (req, res) => {
  const { id } = req.params
  let { supplier, delivery_date, items } = req.body
  const delivery = await Delivery.findByPk(id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  if (delivery.status !== 'Pending')
    return res.status(400).json({ message: 'Cannot edit after received/canceled' })

  // Filter out empty items (no item_name)
  if (Array.isArray(items)) {
    items = items.filter((item) => item && item.item_name)
  }

  await delivery.update({ supplier, delivery_date, items })
  res.json({ message: 'Delivery updated', delivery })
}

// Mark delivery as paid
exports.markAsPaid = async (req, res) => {
  const { id } = req.params
  const { paid_by } = req.body
  const delivery = await Delivery.findByPk(id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  if (delivery.paid_status === 'Paid') {
    return res.status(400).json({ message: 'Already marked as paid' })
  }
  delivery.paid_status = 'Paid'
  delivery.paid_at = new Date()
  delivery.paid_by = paid_by || null
  await delivery.save()
  res.json({ message: 'Delivery marked as paid', delivery })
}
