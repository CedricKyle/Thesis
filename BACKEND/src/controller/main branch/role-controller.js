import pool from '../../config/database.js'

// Convert to named exports instead of object
export const getAllRoles = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT *, created_at, updated_at FROM roles')
    res.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ error: 'Failed to fetch roles' })
  }
}

export const getRoleByName = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles WHERE role_name = ?', [
      req.params.roleName,
    ])
    if (roles.length === 0) {
      return res.status(404).json({ error: 'Role not found' })
    }
    res.json(roles[0])
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({ error: 'Failed to fetch role' })
  }
}

export const createRole = async (req, res) => {
  try {
    const { role_name, description, department, permissions } = req.body
    const [result] = await pool.query(
      'INSERT INTO roles (role_name, description, department, permissions) VALUES (?, ?, ?, ?)',
      [role_name, description, department, JSON.stringify(permissions)],
    )

    const [newRole] = await pool.query('SELECT * FROM roles WHERE id = ?', [result.insertId])
    res.status(201).json(newRole[0])
  } catch (error) {
    console.error('Error creating role:', error)
    res.status(500).json({ error: 'Failed to create role' })
  }
}

export const updateRole = async (req, res) => {
  try {
    const { role_name, description, department, permissions } = req.body
    await pool.query(
      'UPDATE roles SET role_name = ?, description = ?, department = ?, permissions = ? WHERE id = ?',
      [role_name, description, department, JSON.stringify(permissions), req.params.id],
    )

    const [updatedRole] = await pool.query('SELECT * FROM roles WHERE id = ?', [req.params.id])
    if (updatedRole.length === 0) {
      return res.status(404).json({ error: 'Role not found' })
    }
    res.json(updatedRole[0])
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ error: 'Failed to update role' })
  }
}

export const deleteRole = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' })
    }
    res.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    res.status(500).json({ error: 'Failed to delete role' })
  }
}

export const getRoleById = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [req.params.id])

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Role not found' })
    }

    // Parse permissions if it's stored as a string
    const role = roles[0]
    if (typeof role.permissions === 'string') {
      role.permissions = JSON.parse(role.permissions)
    }

    res.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({ error: 'Failed to fetch role' })
  }
}
