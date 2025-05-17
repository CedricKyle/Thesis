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
      // 1. Generate item_code if missing
      let itemCode = item.item_code
      if (!itemCode || itemCode.trim() === '') {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const prefix = `RAW-${year}${month}`
        const latest = await Inventory.findOne({
          where: { item_code: { [Op.like]: `${prefix}%` } },
          order: [['item_code', 'DESC']],
        })
        let next = 1
        if (latest) {
          const latestNum = parseInt(latest.item_code.split('-')[2])
          next = latestNum + 1
        }
        itemCode = `${prefix}-${String(next).padStart(4, '0')}`
        item.item_code = itemCode // update the item object for later use
      }

      // 2. Create receiving item record (use itemCode)
      await InventoryReceivingItem.create(
        {
          receiving_id,
          item_code: itemCode,
          item_name: item.item_name,
          quantity_received: item.quantity_received,
          unit: item.unit,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
        },
        { transaction: t },
      )

      // 3. Update or create inventory record
      const inv = await Inventory.findOne({ where: { item_code: itemCode } })
      if (inv) {
        inv.quantity = parseFloat(inv.quantity) + parseFloat(item.quantity_received)
        inv.last_received = new Date()
        await inv.save({ transaction: t })
      } else {
        await Inventory.create(
          {
            item_code: itemCode,
            item_name: item.item_name,
            description: item.description || '',
            category: item.category || '',
            unit: item.unit,
            quantity: item.quantity_received,
            reorder_point:
              !item.reorder_point || isNaN(item.reorder_point) || Number(item.reorder_point) <= 0
                ? Math.max(1, Math.floor(Number(item.quantity_received) * 0.3))
                : Number(item.reorder_point),
            last_received: new Date(),
          },
          { transaction: t },
        )
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
