const { Delivery, SCMRequest } = require('../../../model/Index')

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

// Mark as received
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
