const { Role, Employee, sequelize } = require('../../model/Index.js') // We'll create this Sequelize model

// Convert to named exports instead of object
const getAllRoles = async (req, res) => {
  try {
    // Convert string 'true'/'false' to boolean
    const showArchived = req.query.showArchived === 'true'
    const roles = await Role.findAll({
      paranoid: !showArchived, // When showArchived is true, paranoid should be false
      attributes: [
        'id',
        'role_name',
        'description',
        'department',
        'permissions',
        'created_at',
        'updated_at',
        'deleted_at',
      ],
    })

    const formattedRoles = roles.map((role) => ({
      ...role.toJSON(),
      permissions:
        typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions,
      is_deleted: !!role.deleted_at,
    }))

    res.json(formattedRoles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({
      message: 'Failed to fetch roles',
      error: error.message,
    })
  }
}

const getRoleByName = async (req, res) => {
  try {
    const role = await Role.findOne({
      where: { role_name: req.params.roleName },
      include: [
        {
          model: Employee,
          attributes: ['employee_id', 'first_name', 'last_name'],
          as: 'employees',
        },
      ],
    })

    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    // Parse permissions if stored as string
    const formattedRole = {
      ...role.toJSON(),
      permissions:
        typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions,
    }

    res.json(formattedRole)
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({
      message: 'Failed to fetch role',
      error: error.message,
    })
  }
}

const createRole = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { role_name, description, department, permissions } = req.body

    // Validate required fields
    if (!role_name || !department) {
      await t.rollback()
      return res.status(400).json({
        message: 'Role name and department are required',
      })
    }

    // Check if role already exists
    const existingRole = await Role.findOne({
      where: { role_name },
      transaction: t,
    })

    if (existingRole) {
      await t.rollback()
      return res.status(409).json({
        message: 'Role name already exists',
      })
    }

    const newRole = await Role.create(
      {
        role_name,
        description,
        department,
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
      },
      { transaction: t },
    )

    await t.commit()

    // Parse permissions for response
    const formattedRole = {
      ...newRole.toJSON(),
      permissions:
        typeof newRole.permissions === 'string'
          ? JSON.parse(newRole.permissions)
          : newRole.permissions,
    }

    res.status(201).json(formattedRole)
  } catch (error) {
    await t.rollback()
    console.error('Error creating role:', error)
    res.status(500).json({
      message: 'Failed to create role',
      error: error.message,
    })
  }
}

const updateRole = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { role_name, description, department, permissions } = req.body

    // Validate required fields
    if (!role_name || !department) {
      await t.rollback()
      return res.status(400).json({
        message: 'Role name and department are required',
      })
    }

    const [updated] = await Role.update(
      {
        role_name,
        description,
        department,
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
      },
      {
        where: { id: req.params.id },
        transaction: t,
      },
    )

    if (!updated) {
      await t.rollback()
      return res.status(404).json({ message: 'Role not found' })
    }

    const updatedRole = await Role.findByPk(req.params.id, { transaction: t })

    await t.commit()

    // Parse permissions for response
    const formattedRole = {
      ...updatedRole.toJSON(),
      permissions:
        typeof updatedRole.permissions === 'string'
          ? JSON.parse(updatedRole.permissions)
          : updatedRole.permissions,
    }

    res.json(formattedRole)
  } catch (error) {
    await t.rollback()
    console.error('Error updating role:', error)
    res.status(500).json({
      message: 'Failed to update role',
      error: error.message,
    })
  }
}

const deleteRole = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params
    const { force } = req.query

    // Check if role is assigned to any active employees
    const employeesWithRole = await Employee.findOne({
      where: { role: id },
      paranoid: true, // Only check active employees
    })

    if (employeesWithRole) {
      await t.rollback()
      return res.status(400).json({
        message: 'Cannot delete role: Role is assigned to active employees',
        hint: 'Reassign employees to different roles before deletion',
      })
    }

    if (force === 'true') {
      // Permanent delete
      await Role.destroy({
        where: { id },
        force: true,
        transaction: t,
      })
    } else {
      // Soft delete
      await Role.destroy({
        where: { id },
        transaction: t,
      })
    }

    await t.commit()
    res.json({
      message: force === 'true' ? 'Role permanently deleted' : 'Role archived successfully',
      roleId: id,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error deleting role:', error)
    res.status(500).json({
      message: 'Failed to delete role',
      error: error.message,
    })
  }
}

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          attributes: ['employee_id', 'first_name', 'last_name'],
        },
      ],
    })

    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    // Parse permissions for response
    const formattedRole = {
      ...role.toJSON(),
      permissions:
        typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions,
    }

    res.json(formattedRole)
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({
      message: 'Failed to fetch role',
      error: error.message,
    })
  }
}

// Add restore role function
const restoreRole = async (req, res) => {
  let t = null
  try {
    t = await sequelize.transaction()
    const { id } = req.params

    // Check if role exists and is deleted
    const role = await Role.findOne({
      where: { id },
      paranoid: false,
    })

    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    if (!role.deleted_at) {
      return res.status(400).json({ message: 'Role is not deleted' })
    }

    // Restore using Sequelize's restore method
    await role.restore({ transaction: t })

    // Get fresh data after restore
    const restoredRole = await Role.findByPk(id, {
      transaction: t,
      paranoid: false, // Make sure we can find it
    })

    if (!restoredRole) {
      throw new Error('Role could not be restored')
    }

    await t.commit()

    // Format the response
    const roleData = restoredRole.toJSON()

    res.json({
      message: 'Role restored successfully',
      role: {
        ...roleData,
        permissions:
          typeof roleData.permissions === 'string'
            ? JSON.parse(roleData.permissions)
            : roleData.permissions,
        is_deleted: false,
      },
    })
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback()
    }
    console.error('Error restoring role:', error)
    res.status(500).json({
      message: 'Failed to restore role',
      error: error.message,
    })
  }
}

module.exports = {
  getAllRoles,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  restoreRole,
}
