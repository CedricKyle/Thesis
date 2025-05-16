const { SCMRequest, Employee, Delivery, SCMRequestItem } = require('../../model/Index.js')

// Release cash for a request
const releaseCash = async (req, res) => {
  try {
    // 1. Get the request ID from the URL
    const { id } = req.params

    // 2. Get the employee ID of the treasury user (from your auth middleware)
    const releasedBy = req.user.employee_id

    // 3. Find the request in the database
    const request = await SCMRequest.findOne({ where: { request_id: id } })
    if (!request) return res.status(404).json({ message: 'Request not found' })

    // 4. Only allow if status is Approved and payment_status is For Release
    if (request.request_status !== 'Approved' || request.payment_status !== 'For Release') {
      return res.status(400).json({ message: 'Request not ready for release' })
    }

    // 5. Handle file upload (if any)
    let receiptUrl = null
    if (req.file) {
      receiptUrl = req.file.filename // multer saves the file and gives you the filename
    }

    // 6. Update the request with treasury info
    await request.update({
      payment_status: 'Released',
      released_by: releasedBy,
      released_at: new Date(),
      receipt_url: receiptUrl,
    })

    // 7. Re-fetch the request with includes
    const updatedRequest = await SCMRequest.findOne({
      where: { request_id: id },
      include: [
        { model: Employee, as: 'preparedBy', attributes: ['full_name'] },
        { model: Employee, as: 'approvedBy', attributes: ['full_name'] },
        { model: Employee, as: 'releasedBy', attributes: ['full_name'] },
        // ...other includes if needed
      ],
    })

    // 8. Check if delivery already exists for this request
    const existingDelivery = await Delivery.findOne({ where: { request_id: request.request_id } })
    if (!existingDelivery) {
      const items = await SCMRequestItem.findAll({ where: { request_id: request.request_id } })
      await Delivery.create({
        request_id: request.request_id,
        supplier: 'STATIC SUPPLIER',
        items: items.map((i) => i.toJSON()),
        delivery_date: new Date(),
        status: 'Pending',
      })
    }

    // 9. Respond with the updated request
    res.json({ message: 'Cash released successfully', request: updatedRequest })
  } catch (error) {
    console.error('Error releasing cash:', error)
    res.status(500).json({ message: 'Error releasing cash', error: error.message })
  }
}

// Example for fetching released requests:
const getReleasedRequests = async (req, res) => {
  try {
    const requests = await SCMRequest.findAll({
      where: { payment_status: 'Released' },
      include: [
        // ...other includes (preparedBy, approvedBy, etc.)
        { model: Employee, as: 'releasedBy', attributes: ['full_name'] },
      ],
    })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching released requests', error: error.message })
  }
}

const getRequestById = async (req, res) => {
  try {
    const request = await SCMRequest.findOne({
      where: { request_id: req.params.id },
      include: [
        { model: Employee, as: 'releasedBy', attributes: ['full_name'] },
        // ...other includes
      ],
    })
    res.json(request)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching request', error: error.message })
  }
}

module.exports = { releaseCash, getReleasedRequests, getRequestById }
