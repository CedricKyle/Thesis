const { InventoryReceiving, InventoryReceivingItem, Inventory } = require('../../../model/Index.js')
const { Op } = require('sequelize')

const generateReceivingId = async () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `RCV-${year}${month}`

  const latest = await InventoryReceiving.findOne({
    where: { receiving_id: { [Op.like]: `${prefix}%` } },
    order: [['receiving_id', 'DESC']],
  })

  let next = 1
  if (latest) {
    const latestNum = parseInt(latest.receiving_id.split('-')[2])
    next = latestNum + 1
  }
  return `${prefix}-${String(next).padStart(4, '0')}`
}

const createReceiving = async (req, res) => {
  const t = await InventoryReceiving.sequelize.transaction()
  try {
    const { request_id, supplier_name, received_by, remarks, items } = req.body

    const receiving_id = await generateReceivingId()

    const receiving = await InventoryReceiving.create(
      {
        receiving_id,
        request_id,
        supplier_name,
        received_by,
        remarks,
      },
      { transaction: t },
    )

    for (const item of items) {
      await InventoryReceivingItem.create(
        {
          receiving_id,
          item_code: item.item_code,
          item_name: item.item_name,
          quantity_received: item.quantity_received,
          unit: item.unit,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
        },
        { transaction: t },
      )

      const inv = await Inventory.findOne({ where: { item_code: item.item_code } })
      if (inv) {
        inv.quantity = parseFloat(inv.quantity) + parseFloat(item.quantity_received)
        inv.last_received = new Date()
        await inv.save({ transaction: t })
      }
    }

    await t.commit()
    res.status(201).json({ message: 'Receiving recorded successfully', receiving_id })
  } catch (error) {
    await t.rollback()
    res.status(500).json({ message: 'Error recording receiving', error: error.message })
  }
}

const getAllReceivings = async (req, res) => {
  try {
    const receivings = await InventoryReceiving.findAll({
      include: [{ model: InventoryReceivingItem, as: 'items' }],
      order: [['created_at', 'DESC']],
    })
    res.json(receivings)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receivings', error: error.message })
  }
}

const getReceivingById = async (req, res) => {
  try {
    const { receiving_id } = req.params
    const receiving = await InventoryReceiving.findOne({
      where: { receiving_id },
      include: [{ model: InventoryReceivingItem, as: 'items' }],
    })
    if (!receiving) return res.status(404).json({ message: 'Receiving not found' })
    res.json(receiving)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receiving', error: error.message })
  }
}

module.exports = {
  createReceiving,
  getAllReceivings,
  getReceivingById,
}
