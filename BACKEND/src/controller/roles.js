const db = require('../config/database')

const rolesController = {
  // Get all roles with permissions
  getAllRoles: async (req, res) => {
    try {
      const [roles] = await db.query(`
        SELECT r.id, r.role_name, r.description, r.last_modified, 
               GROUP_CONCAT(rp.permission_id) AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id
      `)

      // Transform the permissions from a comma-separated string to an array
      const rolesWithPermissions = roles.map((role) => ({
        ...role,
        permissions: role.permissions ? role.permissions.split(',').map(Number) : [],
      }))

      res.json(rolesWithPermissions)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Create new role
  createRole: async (req, res) => {
    try {
      const { role_name, description, permissions } = req.body

      // Check for duplicate role name
      const [existingRole] = await db.query('SELECT * FROM roles WHERE role_name = ?', [role_name])
      if (existingRole.length > 0) {
        return res.status(400).json({ message: 'Role name already exists' })
      }

      // Log received data
      console.log('Received role data:', { role_name, description, permissions })

      // Validate input
      if (!role_name) {
        return res.status(400).json({ message: 'Role name is required' })
      }

      const connection = await db.getConnection()
      await connection.beginTransaction()

      try {
        // Insert role
        console.log('Inserting role...')
        const [result] = await connection.query(
          'INSERT INTO roles (role_name, description) VALUES (?, ?)',
          [role_name, description],
        )
        const roleId = result.insertId
        console.log('Role inserted, ID:', roleId)

        // Insert permissions if they exist
        if (permissions && permissions.length > 0) {
          console.log('Inserting permissions:', permissions)
          const values = permissions.map((permId) => [roleId, permId])
          await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [
            values,
          ])
          console.log('Permissions inserted')
        }

        await connection.commit()
        connection.release()

        res.status(201).json({
          message: 'Role created successfully',
          roleId: roleId,
        })
      } catch (error) {
        console.error('Database error:', error)
        await connection.rollback()
        connection.release()
        throw error
      }
    } catch (error) {
      console.error('Error in createRole:', error)
      res.status(500).json({
        message: 'Error creating role',
        error: error.message,
        stack: error.stack, // Remove this in production
      })
    }
  },

  // Update role
  updateRole: async (req, res) => {
    const connection = await db.getConnection()
    try {
      console.log('Update request received:', req.body) // Log the request body
      const { role_name, description, permissions } = req.body
      const roleId = req.params.id

      // Check if role exists
      const [existingRole] = await connection.query('SELECT id FROM roles WHERE id = ?', [roleId])
      if (existingRole.length === 0) {
        return res.status(404).json({ message: 'Role not found' })
      }

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
