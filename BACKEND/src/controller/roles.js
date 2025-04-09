const db = require('../config/database')

const rolesController = {
  // Get all roles
  getAllRoles: async (req, res) => {
    try {
      const [roles] = await db.query('SELECT * FROM roles')
      res.json(roles)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Create new role
  createRole: async (req, res) => {
    try {
      const { role_name, description, permissions } = req.body

      console.log('Creating role with:', { role_name, description, permissions })

      // First just try to create the role without permissions
      const [result] = await db.query('INSERT INTO roles (role_name, description) VALUES (?, ?)', [
        role_name,
        description,
      ])

      const roleId = result.insertId
      console.log('Role created with ID:', roleId)

      // If we have permissions, add them
      if (permissions && permissions.length > 0) {
        console.log('Adding permissions:', permissions)
        const values = permissions.map((permId) => [roleId, permId])
        await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values])
      }

      res.status(201).json({
        message: 'Role created successfully',
        roleId: roleId,
      })
    } catch (error) {
      console.error('Error in createRole:', error)
      res.status(500).json({
        message: 'Error creating role',
        error: error.message,
      })
    }
  },

  // Update role
  updateRole: async (req, res) => {
    const connection = await db.getConnection()
    try {
      const { role_name, description, permissions } = req.body
      const roleId = req.params.id

      await connection.beginTransaction()

      // Update role details
      await connection.query('UPDATE roles SET role_name = ?, description = ? WHERE id = ?', [
        role_name,
        description,
        roleId,
      ])

      // Update permissions
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId])

      if (permissions && permissions.length > 0) {
        const values = permissions.map((permId) => [roleId, permId])
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [
          values,
        ])
      }

      await connection.commit()
      res.json({ message: 'Role updated successfully' })
    } catch (error) {
      await connection.rollback()
      console.error('Error updating role:', error)
      res.status(500).json({
        message: 'Error updating role',
        error: error.message,
      })
    } finally {
      connection.release()
    }
  },

  // Delete role
  deleteRole: async (req, res) => {
    try {
      const roleId = req.params.id
      await db.query('DELETE FROM roles WHERE id = ?', [roleId])
      res.json({ message: 'Role deleted successfully' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
}

module.exports = rolesController
