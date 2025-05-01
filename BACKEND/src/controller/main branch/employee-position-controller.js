const { Position } = require('../../model/Index.js')

// Get all positions (active only)
exports.getAllPositions = async (req, res) => {
  const positions = await Position.findAll()
  res.json(positions)
}

// Get all positions (including archived)
exports.getAllPositionsWithArchived = async (req, res) => {
  const positions = await Position.findAll({ paranoid: false })
  res.json(positions)
}

// Create a new position with duplicate check
exports.createPosition = async (req, res) => {
  const { position_title, department, branch, rate_per_hour } = req.body

  // Check for duplicate (same title, department, and branch)
  const existing = await Position.findOne({
    where: {
      position_title,
      department,
      branch,
      deleted_at: null, // Only check active positions
    },
  })

  if (existing) {
    return res.status(400).json({
      message: 'A position with the same title, department, and branch already exists.',
    })
  }

  const position = await Position.create({ position_title, department, branch, rate_per_hour })
  res.status(201).json(position)
}

// Update a position
exports.updatePosition = async (req, res) => {
  const { id } = req.params
  const { position_title, department, branch, rate_per_hour } = req.body
  const position = await Position.findByPk(id)
  if (!position) return res.status(404).json({ message: 'Not found' })
  await position.update({ position_title, department, branch, rate_per_hour })
  res.json(position)
}

// Soft delete a position
exports.deletePosition = async (req, res) => {
  const { id } = req.params
  const position = await Position.findByPk(id)
  if (!position) return res.status(404).json({ message: 'Not found' })
  await position.destroy() // This will set deleted_at
  res.json({ message: 'Position archived (soft deleted)' })
}

// Restore a soft-deleted position
exports.restorePosition = async (req, res) => {
  const { id } = req.params
  const position = await Position.findByPk(id, { paranoid: false })
  if (!position) return res.status(404).json({ message: 'Not found' })

  // Check for active duplicate before restoring
  const existing = await Position.findOne({
    where: {
      position_title: position.position_title,
      department: position.department,
      branch: position.branch,
      deleted_at: null,
    },
  })
  if (existing) {
    return res.status(400).json({
      message:
        'Cannot restore: an active position with the same title, department, and branch already exists.',
    })
  }

  await position.restore()
  res.json({ message: 'Position restored' })
}
