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
      console.log('Update request received:', req.body)
      const { role_name, description, permissions } = req.body
      const roleId = req.params.id
      let changesDetected = false

      // Check if role exists and get current values
      const [existingRole] = await connection.query(
        'SELECT r.role_name, r.description, GROUP_CONCAT(rp.permission_id) as permissions FROM roles r ' +
          'LEFT JOIN role_permissions rp ON r.id = rp.role_id ' +
          'WHERE r.id = ? GROUP BY r.id',
        [roleId],
      )

      if (existingRole.length === 0) {
        return res.status(404).json({ message: 'Role not found' })
      }

      const currentPermissions = existingRole[0].permissions
        ? existingRole[0].permissions.split(',').map(Number).sort().join(',')
        : ''
      const newPermissions = permissions ? permissions.sort().join(',') : ''

      // Check if anything has changed
      if (role_name && role_name !== existingRole[0].role_name) changesDetected = true
      if (description !== undefined && description !== existingRole[0].description)
        changesDetected = true
      if (permissions !== undefined && currentPermissions !== newPermissions) changesDetected = true

      if (!changesDetected) {
        return res.json({ message: 'No changes detected', status: 'unchanged' })
      }

      await connection.beginTransaction()

      // Only update fields that are provided
      if (role_name || description) {
        let updateQuery = 'UPDATE roles SET'
        const updateValues = []
        const updateFields = []

        if (role_name) {
          // Check for duplicate role name if it's being changed
          if (role_name !== existingRole[0].role_name) {
            const [duplicateCheck] = await connection.query(
              'SELECT id FROM roles WHERE role_name = ? AND id != ?',
              [role_name, roleId],
            )
            if (duplicateCheck.length > 0) {
              return res.status(400).json({ message: 'Role name already exists' })
            }
            // Update user_roles table first to maintain referential integrity
            await connection.query('UPDATE user_roles SET role_name = ? WHERE role_name = ?', [
              role_name,
              existingRole[0].role_name,
            ])
          }
          updateFields.push(' role_name = ?')
          updateValues.push(role_name)
        }

        if (description !== undefined) {
          updateFields.push(' description = ?')
          updateValues.push(description)
        }

        if (updateFields.length > 0) {
          updateQuery += updateFields.join(',') + ' WHERE id = ?'
          updateValues.push(roleId)
          await connection.query(updateQuery, updateValues)
        }
      }

      // Update permissions if provided
      if (permissions !== undefined) {
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId])

        if (permissions && permissions.length > 0) {
          const values = permissions.map((permId) => [roleId, permId])
          await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [
            values,
          ])
        }
      }

      await connection.commit()
      res.json({ message: 'Role updated successfully', status: 'updated' })
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
    const connection = await db.getConnection()
    try {
      const roleId = req.params.id

      // Get role name first
      const [role] = await connection.query('SELECT role_name FROM roles WHERE id = ?', [roleId])
      if (role.length === 0) {
        return res.status(404).json({ message: 'Role not found' })
      }

      // Check if role is in use
      const [users] = await connection.query(
        `
        SELECT COUNT(u.id) as count, GROUP_CONCAT(u.full_name) as userNames
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_name = ?
      `,
        [role[0].role_name],
      )

      if (users[0].count > 0) {
        return res.status(400).json({
          message: `Cannot delete role: ${users[0].count} user(s) are currently assigned to this role`,
          userNames: users[0].userNames ? users[0].userNames.split(',') : [],
        })
      }

      await connection.beginTransaction()

      // Delete role permissions first
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId])

      // Then delete the role
      await connection.query('DELETE FROM roles WHERE id = ?', [roleId])

      await connection.commit()
      res.json({ message: 'Role deleted successfully' })
    } catch (error) {
      await connection.rollback()
      console.error('Error deleting role:', error)
      res.status(500).json({ message: error.message })
    } finally {
      connection.release()
    }
  },

  // Get role by ID
  getRoleById: async (req, res) => {
    const connection = await db.getConnection()
    try {
      const roleId = req.params.id

      // Query to get role details with permissions
      const query = `
        SELECT r.id, r.role_name, r.description, r.last_modified,
               GROUP_CONCAT(rp.permission_id) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.id = ?
        GROUP BY r.id
      `

      const [roles] = await connection.query(query, [roleId])

      if (!roles || roles.length === 0) {
        return res.status(404).json({ message: 'Role not found' })
      }

      // Transform the role data
      const role = {
        ...roles[0],
        permissions: roles[0].permissions ? roles[0].permissions.split(',').map(Number) : [],
      }

      res.json(role)
    } catch (error) {
      console.error('Error in getRoleById:', error)
      res.status(500).json({
        message: 'Error getting role details',
        error: error.message,
      })
    } finally {
      connection.release()
    }
  },

  // Add this new function to check users with role
  getRoleUsers: async (req, res) => {
    const connection = await db.getConnection()
    try {
      const roleId = req.params.id

      // First get the role_name for this role ID
      const [role] = await connection.query('SELECT role_name FROM roles WHERE id = ?', [roleId])

      if (role.length === 0) {
        return res.status(404).json({ message: 'Role not found' })
      }

      // Then get users with this role_name
      const [users] = await connection.query(
        `
        SELECT COUNT(u.id) as count, GROUP_CONCAT(u.full_name) as userNames
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_name = ?
      `,
        [role[0].role_name],
      )

      res.json({
        usersCount: users[0].count,
        userNames: users[0].userNames ? users[0].userNames.split(',') : [],
      })
    } catch (error) {
      console.error('Error checking role users:', error)
      res.status(500).json({ message: error.message })
    } finally {
      connection.release()
    }
  },
}

module.exports = rolesController
