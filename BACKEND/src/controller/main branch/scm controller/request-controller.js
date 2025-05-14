const { SCMRequest, SCMRequestItem, Employee, sequelize } = require('../../../model/Index.js')
const { Sequelize } = require('sequelize')

// Generate a unique request ID based on date and sequence
const generateRequestId = async () => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')

  const prefix = `REQ-${year}${month}`

  // Find the highest existing ID with this prefix
  const latestRequest = await SCMRequest.findOne({
    where: {
      request_id: {
        [Sequelize.Op.like]: `${prefix}%`,
      },
    },
    order: [['request_id', 'DESC']],
  })

  let nextNumber = 1
  if (latestRequest) {
    const latestNumber = parseInt(latestRequest.request_id.split('-')[2])
    nextNumber = latestNumber + 1
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

// Create a new request
const createRequest = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { description, requestItems, preparedBy } = req.body

    if (!requestItems || !Array.isArray(requestItems) || requestItems.length === 0) {
      return res.status(400).json({
        message: 'No request items provided',
      })
    }

    // Calculate total amount
    const totalAmount = requestItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

    // Generate request ID
    const requestId = await generateRequestId()

    // Create the main request
    const request = await SCMRequest.create(
      {
        request_id: requestId,
        description,
        request_status: 'Pending',
        prepared_by: preparedBy,
        total_amount: totalAmount,
      },
      { transaction: t },
    )

    // Create all request items
    const requestItemsToCreate = requestItems.map((item) => ({
      request_id: requestId,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      amount: item.amount,
    }))

    await SCMRequestItem.bulkCreate(requestItemsToCreate, { transaction: t })

    await t.commit()

    res.status(201).json({
      message: 'Request created successfully',
      request: {
        request_id: requestId,
        description,
        request_date: request.request_date,
        request_status: request.request_status,
        total_amount: totalAmount,
      },
    })
  } catch (error) {
    await t.rollback()
    console.error('Error creating request:', error)

    res.status(500).json({
      message: 'Error creating request',
      error: error.message,
    })
  }
}

// Get all requests
const getAllRequests = async (req, res) => {
  try {
    const { showArchived } = req.query

    const requests = await SCMRequest.findAll({
      paranoid: showArchived === 'true' ? false : true,
      include: [
        {
          model: SCMRequestItem,
          as: 'requestItems',
          attributes: ['id', 'item_name', 'quantity', 'unit', 'unit_price', 'amount'],
        },
      ],
      order: [['request_date', 'DESC']],
    })

    res.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    res.status(500).json({
      message: 'Error fetching requests',
      error: error.message,
    })
  }
}

// Get request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params

    const request = await SCMRequest.findOne({
      where: { request_id: id },
      include: [
        {
          model: SCMRequestItem,
          as: 'requestItems',
          attributes: ['id', 'item_name', 'quantity', 'unit', 'unit_price', 'amount'],
        },
      ],
    })

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    res.json(request)
  } catch (error) {
    console.error('Error fetching request:', error)
    res.status(500).json({
      message: 'Error fetching request',
      error: error.message,
    })
  }
}

// Update request status
const updateRequestStatus = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { status, approvedBy } = req.body

    if (!['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value',
        allowedValues: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      })
    }

    const request = await SCMRequest.findOne({
      where: { request_id: id },
    })

    if (!request) {
      await t.rollback()
      return res.status(404).json({ message: 'Request not found' })
    }

    // Update the request
    await SCMRequest.update(
      {
        request_status: status,
        approved_by: approvedBy,
      },
      {
        where: { request_id: id },
        transaction: t,
      },
    )

    await t.commit()

    res.json({
      message: 'Request status updated successfully',
      requestId: id,
      newStatus: status,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error updating request status:', error)

    res.status(500).json({
      message: 'Error updating request status',
      error: error.message,
    })
  }
}

// Delete (archive) a request
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params

    const request = await SCMRequest.findOne({
      where: { request_id: id },
    })

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // First update status to Cancelled
    await SCMRequest.update({ request_status: 'Cancelled' }, { where: { request_id: id } })

    // Then soft delete
    await SCMRequest.destroy({
      where: { request_id: id },
    })

    res.json({
      message: 'Request cancelled successfully',
      requestId: id,
    })
  } catch (error) {
    console.error('Error cancelling request:', error)

    res.status(500).json({
      message: 'Error cancelling request',
      error: error.message,
    })
  }
}

// Restore an archived request
const restoreRequest = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params

    // Restore the soft-deleted request
    const restoredCount = await SCMRequest.restore({
      where: { request_id: id },
      transaction: t,
    })

    if (restoredCount === 0) {
      await t.rollback()
      return res.status(404).json({
        message: 'Request not found or not archived',
      })
    }

    // Set status back to Pending (or your desired status)
    await SCMRequest.update(
      { request_status: 'Pending' },
      { where: { request_id: id }, transaction: t },
    )

    await t.commit()

    res.json({
      message: 'Request restored successfully',
      requestId: id,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error restoring request:', error)

    res.status(500).json({
      message: 'Error restoring request',
      error: error.message,
    })
  }
}

// Update request
const updateRequest = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params
    const { description, requestItems } = req.body

    // Find the request
    const request = await SCMRequest.findOne({ where: { request_id: id } })
    if (!request) {
      await t.rollback()
      return res.status(404).json({ message: 'Request not found' })
    }

    // Only allow editing if Pending or Rejected
    if (request.request_status !== 'Pending' && request.request_status !== 'Rejected') {
      await t.rollback()
      return res.status(400).json({ message: 'Only pending or rejected requests can be edited' })
    }

    // Update main request
    const totalAmount = requestItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
    await SCMRequest.update(
      { description, total_amount: totalAmount },
      { where: { request_id: id }, transaction: t },
    )

    // Remove old items and add new ones
    await SCMRequestItem.destroy({ where: { request_id: id }, transaction: t })
    const requestItemsToCreate = requestItems.map((item) => ({
      request_id: id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      amount: item.amount,
    }))
    await SCMRequestItem.bulkCreate(requestItemsToCreate, { transaction: t })

    await t.commit()
    res.json({ message: 'Request updated successfully' })
  } catch (error) {
    await t.rollback()
    res.status(500).json({ message: 'Error updating request', error: error.message })
  }
}

// Submit request to finance
const submitToFinance = async (req, res) => {
  try {
    const { id } = req.params

    const request = await SCMRequest.findOne({ where: { request_id: id } })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Only allow if status is Pending or Rejected
    if (request.request_status !== 'Pending' && request.request_status !== 'Rejected') {
      return res
        .status(400)
        .json({ message: 'Only pending or rejected requests can be submitted to finance.' })
    }

    await SCMRequest.update({ request_status: 'Submitted' }, { where: { request_id: id } })

    res.json({ message: 'Request submitted to finance successfully', requestId: id })
  } catch (error) {
    res.status(500).json({ message: 'Error submitting to finance', error: error.message })
  }
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
  restoreRequest,
  updateRequest,
  submitToFinance,
}
