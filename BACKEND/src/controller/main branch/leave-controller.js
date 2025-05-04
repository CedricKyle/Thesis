const { Leave, Employee } = require('../../model/Index.js')

// Get all leaves (with employee info)
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [
        {
          model: Employee,
          attributes: ['employee_id', 'first_name', 'last_name', 'full_name', 'department'],
        },
      ],
      order: [['created_at', 'DESC']],
    })
    res.json({ success: true, data: leaves })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create a leave
const createLeave = async (req, res) => {
  try {
    const leave = await Leave.create(req.body)
    // Fetch with join
    const leaveWithEmployee = await Leave.findOne({
      where: { id: leave.id },
      include: [{ model: Employee, attributes: ['full_name'] }],
    })
    res.status(201).json({ success: true, data: leaveWithEmployee })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Approve a leave
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params
    await Leave.update({ status: 'Approved' }, { where: { id } })
    res.json({ success: true, message: 'Leave approved' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Reject a leave
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params
    await Leave.update({ status: 'Rejected' }, { where: { id } })
    res.json({ success: true, message: 'Leave rejected' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// (Optional) Delete a leave
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params
    await Leave.destroy({ where: { id } })
    res.json({ success: true, message: 'Leave deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params
    const leave = await Leave.findOne({ where: { id } })
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' })
    res.json({ success: true, data: leave })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const updateLeave = async (req, res) => {
  try {
    const { id } = req.params
    const [updated] = await Leave.update(req.body, { where: { id } })
    if (!updated) return res.status(404).json({ success: false, message: 'Leave not found' })
    const updatedLeave = await Leave.findByPk(id)
    res.json({ success: true, data: updatedLeave })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const restoreLeave = async (req, res) => {
  try {
    const { id } = req.params
    const restored = await Leave.restore({ where: { id } })
    if (!restored)
      return res.status(404).json({ success: false, message: 'Leave not found or not deleted' })
    res.json({ success: true, message: 'Leave restored' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  approveLeave,
  rejectLeave,
  deleteLeave,
  restoreLeave,
}
