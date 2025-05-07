const { Request, Employee } = require('../../model/Index.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

// CREATE request
const createRequest = async (req, res) => {
  try {
    const {
      item,
      quantity,
      remarks,
      requested_by,
      requestor_name,
      department,
      branch_id,
      finance_remarks,
      requestor_rejection_remarks,
    } = req.body

    if (!item || !quantity || !requested_by) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['item', 'quantity', 'requested_by'],
      })
    }

    const now = dayjs().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')

    // Initial status history
    const statusHistory = [
      {
        status: 'Pending',
        by: requestor_name || requested_by,
        at: now,
        remarks: remarks || null,
      },
    ]

    const newRequest = await Request.create({
      item,
      quantity,
      remarks,
      finance_remarks,
      requestor_rejection_remarks,
      status: 'Pending',
      date_requested: now,
      requested_by,
      department,
      branch_id,
      created_at: now,
      updated_at: now,
      status_history: JSON.stringify(statusHistory),
    })

    res.status(201).json({ message: 'Request created', data: newRequest })
  } catch (error) {
    console.error('Full error:', error)
    res.status(500).json({ message: 'Error creating request', error: error.message })
  }
}

// GET all requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        {
          model: Employee,
          as: 'requester',
          attributes: ['employee_id', 'full_name', 'department', 'branch_id'],
        },
      ],
      order: [['created_at', 'DESC']],
    })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message })
  }
}

// GET single request
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found' })
    res.json(request)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching request', error: error.message })
  }
}

// UPDATE request
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params
    const now = dayjs().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')
    const request = await Request.findByPk(id)
    if (!request) return res.status(404).json({ message: 'Request not found' })

    if (!req.body.action_by) {
      return res.status(400).json({ message: 'Full name of actor (action_by) is required.' })
    }

    // Parse current status history
    let statusHistory = []
    if (request.status_history) {
      statusHistory = JSON.parse(request.status_history)
    }

    // Prepare new status entry
    let actorName = req.body.action_by
    if (!actorName && req.body.action_by_id) {
      const emp = await Employee.findOne({ where: { employee_id: req.body.action_by_id } })
      actorName = emp ? emp.full_name : req.body.action_by_id
    }

    const newStatusEntry = {
      status: req.body.status || request.status,
      by: req.body.action_by || 'SYSTEM',
      at: now,
      remarks:
        req.body.remarks ||
        req.body.finance_remarks ||
        req.body.scm_remarks ||
        req.body.procurement_remarks ||
        req.body.release_remarks ||
        null,
    }
    statusHistory.push(newStatusEntry)

    // Prepare updateData object
    const updateData = {
      ...req.body,
      updated_at: now,
      status_history: JSON.stringify(statusHistory),
    }

    // Per-stage logic
    switch (req.body.status) {
      case 'Approved by SCM':
        updateData.scm_approved_by = req.body.action_by
        updateData.scm_approved_at = now
        updateData.scm_remarks = req.body.scm_remarks || null
        break
      case 'Approved by Finance':
        updateData.finance_approved_by = req.body.action_by
        updateData.finance_approved_at = now
        updateData.finance_remarks = req.body.finance_remarks || null
        break
      case 'Received by Procurement':
        updateData.procurement_received_by = req.body.action_by
        updateData.procurement_received_at = now
        updateData.procurement_remarks = req.body.procurement_remarks || null
        break
      case 'Released to Requestor':
      case 'Completed':
        updateData.scm_released_by = req.body.action_by
        updateData.scm_released_at = now
        updateData.release_remarks = req.body.release_remarks || null
        break
      // Add more cases as needed
    }

    // Remarks validation (example for rejection)
    if (
      req.body.status &&
      req.body.status.toLowerCase().includes('rejected') &&
      !req.body.requestor_rejection_remarks
    ) {
      return res.status(400).json({
        message: 'Rejection remarks are required when rejecting a request',
      })
    }

    const updated = await Request.update(updateData, { where: { id } })
    if (!updated[0]) return res.status(404).json({ message: 'Request not found' })
    res.json({ message: 'Request updated' })
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error: error.message })
  }
}

// SOFT DELETE request
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params
    const now = dayjs().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')
    const deleted = await Request.update({ deleted_at: now }, { where: { id } })
    if (!deleted[0]) return res.status(404).json({ message: 'Request not found' })
    res.json({ message: 'Request archived' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting request', error: error.message })
  }
}

// RESTORE request
const restoreRequest = async (req, res) => {
  try {
    const { id } = req.params
    const now = dayjs().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')
    const restored = await Request.update({ deleted_at: null, updated_at: now }, { where: { id } })
    if (!restored[0]) return res.status(404).json({ message: 'Request not found or not archived' })
    res.json({ message: 'Request restored' })
  } catch (error) {
    res.status(500).json({ message: 'Error restoring request', error: error.message })
  }
}

const allowedTransitions = {
  Pending: ['Approved by SCM', 'Rejected by SCM', 'Cancelled'],
  'Rejected by SCM': ['Pending', 'Cancelled'],
  'Approved by SCM': ['Forwarded to Finance', 'Returned to Requestor', 'Cancelled'],
  'Returned to Requestor': ['Pending', 'Cancelled'],
  'Forwarded to Finance': [
    'Approved by Finance',
    'Rejected by Finance',
    'Returned to SCM',
    'Cancelled',
  ],
  'Rejected by Finance': ['Forwarded to Finance', 'Cancelled'],
  'Approved by Finance': ['Forwarded to Procurement', 'Cancelled'],
  'Forwarded to Procurement': [
    'Procurement Processing',
    'Received by Procurement',
    'On Hold (No Supplier)',
    'On Hold (No Stock)',
    'Cancelled',
  ],
  'On Hold (No Supplier)': ['Forwarded to Procurement', 'Cancelled'],
  'On Hold (No Stock)': ['Forwarded to Procurement', 'Cancelled'],
  'Procurement Processing': [
    'Received by Procurement',
    'On Hold (No Supplier)',
    'On Hold (No Stock)',
    'Cancelled',
  ],
  'Received by Procurement': ['Transferred to SCM', 'Returned to Finance', 'Cancelled'],
  'Transferred to SCM': ['Ready for Release to Requestor', 'Returned to Procurement', 'Cancelled'],
  'Ready for Release to Requestor': ['Released to Requestor', 'Completed', 'Cancelled'],
  'Released to Requestor': ['Completed'],
  Completed: [],
  Cancelled: [],
}

const statusesRequiringRemarks = [
  'Rejected by SCM',
  'Rejected by Finance',
  'Rejected by Procurement',
  'On Hold (No Supplier)',
  'On Hold (No Stock)',
  'Cancelled',
  'Returned to SCM',
  'Returned to Requestor',
  'Returned to Procurement',
]

const batchUpdateStatus = async (req, res) => {
  try {
    const { requestIds, newStatus, action_by, remarks } = req.body
    if (!Array.isArray(requestIds) || !newStatus || !action_by) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    if (!req.body.action_by) {
      return res.status(400).json({ message: 'Full name of actor (action_by) is required.' })
    }

    const now = dayjs().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')
    let updatedCount = 0
    let failed = []

    for (const id of requestIds) {
      const request = await Request.findByPk(id)
      if (!request) {
        failed.push({ id, reason: 'Not found' })
        continue
      }

      // Validation: cannot skip steps
      const currentStatus = request.status
      const allowed = allowedTransitions[currentStatus] || []
      if (!allowed.includes(newStatus)) {
        failed.push({ id, reason: `Invalid transition from "${currentStatus}" to "${newStatus}"` })
        continue
      }

      // Remarks required for special statuses
      if (statusesRequiringRemarks.includes(newStatus) && !remarks) {
        failed.push({ id, reason: 'Remarks required for this action.' })
        continue
      }

      // Update status_history
      let statusHistory = []
      if (request.status_history) {
        statusHistory = JSON.parse(request.status_history)
      }
      let actorName = action_by
      if (!actorName && req.body.action_by_id) {
        const emp = await Employee.findOne({ where: { employee_id: req.body.action_by_id } })
        actorName = emp ? emp.full_name : req.body.action_by_id
      }
      statusHistory.push({
        status: newStatus,
        by: actorName || 'SYSTEM',
        at: now,
        remarks: remarks || null,
      })

      // Prepare updateData
      const updateData = {
        status: newStatus,
        updated_at: now,
        status_history: JSON.stringify(statusHistory),
      }

      // Per-stage fields (optional, add more as needed)
      switch (newStatus) {
        case 'Approved by SCM':
          updateData.scm_approved_by = action_by
          updateData.scm_approved_at = now
          updateData.scm_remarks = remarks || null
          break
        case 'Rejected by SCM':
          updateData.scm_remarks = remarks || null
          break
        case 'Approved by Finance':
          updateData.finance_approved_by = action_by
          updateData.finance_approved_at = now
          updateData.finance_remarks = remarks || null
          break
        case 'Rejected by Finance':
          updateData.finance_remarks = remarks || null
          break
        case 'Received by Procurement':
          updateData.procurement_received_by = action_by
          updateData.procurement_received_at = now
          updateData.procurement_remarks = remarks || null
          break
        case 'Rejected by Procurement':
        case 'On Hold (No Supplier)':
        case 'On Hold (No Stock)':
          updateData.procurement_remarks = remarks || null
          break
        case 'Released to Requestor':
        case 'Completed':
          updateData.scm_released_by = action_by
          updateData.scm_released_at = now
          updateData.release_remarks = remarks || null
          break
        // ...add more as needed
      }

      await Request.update(updateData, { where: { id } })
      updatedCount++
    }

    res.json({
      message: `Batch update done. Updated: ${updatedCount}, Failed: ${failed.length}`,
      failed,
    })
  } catch (error) {
    res.status(500).json({ message: 'Batch update error', error: error.message })
  }
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  restoreRequest,
  batchUpdateStatus,
}
