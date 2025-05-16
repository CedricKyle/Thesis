const {
  ProductionBatch,
  BatchRawMaterial,
  Inventory,
  ProductionFinishedGood,
  sequelize,
} = require('../../../model/Index.js')
const { Op } = require('sequelize')

// Generate batch number (e.g., BN-2024-001)
const generateBatchNumber = async () => {
  const date = new Date()
  const year = date.getFullYear()
  const lastBatch = await ProductionBatch.findOne({
    order: [['created_at', 'DESC']],
  })
  let sequence = 1
  if (lastBatch) {
    const lastSequence = parseInt(lastBatch.batch_number.split('-')[2])
    sequence = lastSequence + 1
  }
  return `BN-${year}-${String(sequence).padStart(3, '0')}`
}

// Get available raw materials from SCM inventory
const getAvailableRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await Inventory.findAll({
      where: {
        category: 'Raw Materials',
        quantity: { [Op.gt]: 0 },
      },
      order: [['item_name', 'ASC']],
    })
    res.json(rawMaterials)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching raw materials', error: error.message })
  }
}

// Create new production batch
const createProductionBatch = async (req, res) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      product_name,
      reorder_point,
      unit,
      production_date,
      production_manager,
      remarks,
      raw_materials, // Array of { inventory_item_code, quantity_used }
      finished_goods, // Array of { item_name, produced_qty, unit, batch_no, expiry_date, image }
    } = req.body

    // Generate batch number
    const batch_number = await generateBatchNumber()

    // Validate raw materials
    for (const material of raw_materials) {
      const inventoryItem = await Inventory.findOne({
        where: { item_code: material.inventory_item_code },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!inventoryItem) throw new Error(`Raw material ${material.inventory_item_code} not found`)
      if (parseFloat(inventoryItem.quantity) < parseFloat(material.quantity_used)) {
        throw new Error(`Insufficient quantity for ${inventoryItem.item_name}`)
      }
    }

    // --- FIFO LOGIC FOR MULTIPLE FINISHED GOODS ---
    // For each finished good, determine if restock or new stock, and assign primary/secondary stock accordingly
    let batchPrimaryStock = 0
    let batchSecondaryStock = 0
    let batchUnit = unit
    let batchExpiryDate = null

    // If you want to summarize the batch's main product, use the first finished good as the representative
    if (finished_goods && finished_goods.length > 0) {
      batchUnit = finished_goods[0].unit
      batchExpiryDate = finished_goods[0].expiry_date
    }

    // Create the batch record (primary/secondary stock will be the sum of all finished goods)
    for (const fg of finished_goods) {
      // Check if this finished good already exists (restock)
      const existingFG = await ProductionFinishedGood.findOne({
        where: { item_name: fg.item_name },
        order: [['expiry_date', 'ASC']],
        transaction,
      })

      if (existingFG) {
        // RESTOCK: FIFO - add to secondary_stock, use earliest expiry if not provided
        batchSecondaryStock += fg.produced_qty
        if (!fg.expiry_date) fg.expiry_date = existingFG.expiry_date
      } else {
        // NEW STOCK
        batchPrimaryStock += fg.produced_qty
      }
    }

    const batch = await ProductionBatch.create(
      {
        batch_number,
        product_name: finished_goods[0]?.item_name || product_name,
        primary_stock: batchPrimaryStock,
        secondary_stock: batchSecondaryStock,
        reorder_point,
        unit: batchUnit,
        production_date,
        expiry_date: batchExpiryDate,
        production_manager,
        remarks,
      },
      { transaction },
    )

    // Create raw materials usage records and update inventory
    for (const material of raw_materials) {
      await BatchRawMaterial.create(
        {
          batch_id: batch.id,
          inventory_item_code: material.inventory_item_code,
          quantity_used: material.quantity_used,
        },
        { transaction },
      )
      await Inventory.decrement(
        { quantity: material.quantity_used },
        {
          where: { item_code: material.inventory_item_code },
          transaction,
        },
      )
    }

    // Create finished goods records (with correct expiry and FIFO info)
    for (const fg of finished_goods) {
      // Check again for expiry logic
      const existingFG = await ProductionFinishedGood.findOne({
        where: { item_name: fg.item_name },
        order: [['expiry_date', 'ASC']],
        transaction,
      })

      let isRestock = false
      let expiryToUse = fg.expiry_date
      if (existingFG) {
        isRestock = true
        if (!fg.expiry_date) expiryToUse = existingFG.expiry_date
      }

      await ProductionFinishedGood.create(
        {
          batch_id: batch.id,
          item_name: fg.item_name,
          produced_qty: fg.produced_qty,
          unit: fg.unit,
          batch_no: fg.batch_no,
          expiry_date: expiryToUse,
          image: fg.image,
          // Optionally, you can add is_restock: isRestock if your model supports it
        },
        { transaction },
      )
    }

    await transaction.commit()
    res
      .status(201)
      .json({ batch, message: 'Production batch and finished goods recorded with FIFO logic!' })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ message: 'Error creating production batch', error: error.message })
  }
}

// Get batch details with raw materials
const getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params
    const batch = await ProductionBatch.findByPk(id, {
      include: [
        {
          model: BatchRawMaterial,
          as: 'raw_materials',
          include: [
            {
              model: Inventory,
              as: 'inventory_item',
              attributes: ['item_code', 'item_name', 'unit'],
            },
          ],
        },
      ],
    })
    if (!batch) return res.status(404).json({ message: 'Batch not found' })
    res.json(batch)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching batch details', error: error.message })
  }
}

// Get all production batches with their finished goods and raw materials
const getProductionBatches = async (req, res) => {
  try {
    const batches = await ProductionBatch.findAll({
      include: [
        {
          model: ProductionFinishedGood,
          as: 'finished_goods',
          required: false,
          attributes: [
            'id',
            'batch_id',
            'item_name',
            'produced_qty',
            'unit',
            'batch_no',
            'expiry_date',
            'image',
            'deleted_at',
          ],
        },
        {
          model: BatchRawMaterial,
          as: 'raw_materials',
          required: false,
          include: [
            {
              model: Inventory,
              as: 'inventory_item',
              required: false,
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      paranoid: true,
    })

    // Transform the data to ensure we have all required fields
    const transformedBatches = batches.map((batch) => ({
      id: batch.id,
      batch_number: batch.batch_number,
      product_name: batch.product_name,
      primary_stock: batch.primary_stock || 0,
      secondary_stock: batch.secondary_stock || 0,
      reorder_point: batch.reorder_point || 0,
      unit: batch.unit,
      production_date: batch.production_date,
      expiry_date: batch.expiry_date,
      production_manager: batch.production_manager,
      remarks: batch.remarks,
      status: batch.status || 'active',
      created_at: batch.created_at,
      updated_at: batch.updated_at,
      finished_goods: (batch.finished_goods || []).map((good) => ({
        id: good.id,
        batch_id: good.batch_id,
        item_name: good.item_name,
        produced_qty: good.produced_qty,
        unit: good.unit,
        batch_no: good.batch_no,
        expiry_date: good.expiry_date,
        image: good.image,
        created_at: good.created_at,
        updated_at: good.updated_at,
        deleted_at: good.deleted_at,
      })),
      raw_materials: batch.raw_materials || [],
    }))

    res.json(transformedBatches)
  } catch (error) {
    console.error('Error fetching production batches:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production batches',
      details: error.message,
    })
  }
}

// Get all finished goods (for dropdown/selection)
const getFinishedGoods = async (req, res) => {
  try {
    const finishedGoods = await ProductionFinishedGood.findAll({
      attributes: ['id', 'item_name', 'unit', 'expiry_date'],
      group: ['item_name'], // To avoid duplicates
      order: [['item_name', 'ASC']],
    })

    res.json({
      success: true,
      data: finishedGoods,
    })
  } catch (error) {
    console.error('Error fetching finished goods:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finished goods',
    })
  }
}

// Get production batch details by ID
const getProductionBatchById = async (req, res) => {
  try {
    const { id } = req.params

    const batch = await ProductionBatch.findOne({
      where: { id },
      include: [
        {
          model: ProductionFinishedGood,
          as: 'finished_goods',
        },
        {
          model: BatchRawMaterial,
          as: 'raw_materials',
          include: [
            {
              model: Inventory,
              as: 'inventory_item',
            },
          ],
        },
      ],
    })

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Production batch not found',
      })
    }

    res.json({
      success: true,
      data: batch,
    })
  } catch (error) {
    console.error('Error fetching production batch:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production batch details',
    })
  }
}

// Find batch by batch_number
const getBatchByBatchNumber = async (req, res) => {
  try {
    const batch = await ProductionBatch.findOne({
      where: { batch_number: req.params.batch_number },
    })
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' })
    }
    res.json({ data: batch })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get all finished goods with their batch info, always include image
const getFinishedGoodsWithBatchInfo = async (req, res) => {
  try {
    const showArchived = req.query.showArchived === 'true'
    const where = showArchived ? { deleted_at: { [Op.not]: null } } : { deleted_at: null }

    const finishedGoods = await ProductionFinishedGood.findAll({
      where,
      include: [
        {
          model: ProductionBatch,
          as: 'batch',
          attributes: [
            'batch_number',
            'primary_stock',
            'secondary_stock',
            'reorder_point',
            'unit',
            'production_date',
            'expiry_date',
            'production_manager',
            'remarks',
            'status',
            'updated_at',
          ],
          required: true,
        },
      ],
      order: [['id', 'DESC']],
      paranoid: false, // Always false so we can filter both active and archived
    })

    // Group by item_name and sum primary/secondary stock, and always include an image
    const groupedGoods = {}

    for (const fg of finishedGoods) {
      const key = fg.item_name
      if (!groupedGoods[key]) {
        groupedGoods[key] = {
          id: fg.id,
          item_name: fg.item_name,
          unit: fg.unit,
          expiry_date: fg.expiry_date,
          image: fg.image, // Set the first image found (most recent due to DESC order)
          batch: {
            batch_number: fg.batch.batch_number,
            primary_stock: fg.batch.primary_stock,
            secondary_stock: fg.batch.secondary_stock,
            reorder_point: fg.batch.reorder_point,
            unit: fg.batch.unit,
            production_date: fg.batch.production_date,
            expiry_date: fg.batch.expiry_date,
            production_manager: fg.batch.production_manager,
            remarks: fg.batch.remarks,
            status: fg.batch.status,
            updated_at: fg.batch.updated_at,
          },
        }
      } else {
        // Sum primary and secondary stock
        groupedGoods[key].batch.primary_stock += fg.batch.primary_stock
        groupedGoods[key].batch.secondary_stock += fg.batch.secondary_stock
        // If image is not yet set or is empty, and this fg has an image, use it
        if (!groupedGoods[key].image && fg.image) {
          groupedGoods[key].image = fg.image
        }
      }
    }

    res.json({
      success: true,
      data: Object.values(groupedGoods),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finished goods with batch info',
    })
  }
}

// Update finished good's name and image
const updateFinishedGood = async (req, res) => {
  try {
    const { id } = req.params // ID of the ProductionFinishedGood
    const { item_name, image } = req.body

    const finishedGood = await ProductionFinishedGood.findByPk(id)
    if (!finishedGood) {
      return res.status(404).json({ success: false, message: 'Finished good not found' })
    }

    // Update fields if provided
    if (item_name) finishedGood.item_name = item_name
    if (image) finishedGood.image = image

    await finishedGood.save()

    res.json({ success: true, data: finishedGood, message: 'Finished good updated successfully!' })
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update finished good', error: error.message })
  }
}

// Soft delete a finished good
const softDeleteFinishedGood = async (req, res) => {
  try {
    const { id } = req.params
    const finishedGood = await ProductionFinishedGood.findByPk(id)
    if (!finishedGood) {
      return res.status(404).json({ success: false, message: 'Finished good not found' })
    }
    await finishedGood.destroy() // This sets deleted_at, doesn't hard delete
    res.json({ success: true, message: 'Finished good soft deleted!' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to soft delete', error: error.message })
  }
}

// Restore a soft-deleted finished good
const restoreFinishedGood = async (req, res) => {
  try {
    const { id } = req.params
    const finishedGood = await ProductionFinishedGood.findOne({
      where: { id },
      paranoid: false, // include soft-deleted
    })
    if (!finishedGood) {
      return res.status(404).json({ success: false, message: 'Finished good not found' })
    }
    await finishedGood.restore()
    res.json({ success: true, message: 'Finished good restored!' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore', error: error.message })
  }
}

module.exports = {
  getAvailableRawMaterials,
  createProductionBatch,
  getBatchDetails,
  getProductionBatches,
  getFinishedGoods,
  getProductionBatchById,
  getBatchByBatchNumber,
  getFinishedGoodsWithBatchInfo,
  updateFinishedGood,
  softDeleteFinishedGood,
  restoreFinishedGood,
}
