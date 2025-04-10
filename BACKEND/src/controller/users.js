const db = require('../config/database')
const bcrypt = require('bcrypt') // We'll use this for password hashing

const userController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const [users] = await db.query(`
        SELECT u.*, ur.role_name 
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
      `)

      res.json(users)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Create new user
  createUser: async (req, res) => {
    const connection = await db.getConnection()
    try {
      const {
        fullName,
        email,
        contactNumber,
        gender,
        dateOfBirth,
        password,
        role,
        status = 'Active',
      } = req.body

      // Validate required fields
      if (!fullName || !email || !password || !role || !contactNumber || !gender || !dateOfBirth) {
        return res.status(400).json({ message: 'All fields are required' })
      }

      // Check for duplicates in multiple columns
      const [duplicateChecks] = await connection.query(
        'SELECT * FROM users WHERE email = ? OR full_name = ? OR contact_number = ?',
        [email, fullName, contactNumber],
      )

      if (duplicateChecks.length > 0) {
        const duplicateFields = []

        duplicateChecks.forEach((user) => {
          if (user.email === email) duplicateFields.push('Email')
          if (user.full_name === fullName) duplicateFields.push('Full Name')
          if (user.contact_number === contactNumber) duplicateFields.push('Contact Number')
        })

        return res.status(400).json({
          message: 'Duplicate entries found',
          duplicateFields: duplicateFields,
          details: `${duplicateFields.join(', ')} already exists`,
        })
      }

      await connection.beginTransaction()

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert user
      const [result] = await connection.query(
        `INSERT INTO users (
          full_name, email, contact_number, gender, 
          date_of_birth, password, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, contactNumber, gender, dateOfBirth, hashedPassword, status],
      )

      const userId = result.insertId

      // Assign role
      await connection.query('INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)', [
        userId,
        role,
      ])

      await connection.commit()

      res.status(201).json({
        message: 'User created successfully',
        userId: userId,
      })
    } catch (error) {
      await connection.rollback()
      console.error('Error in createUser:', error)

      // Handle specific MySQL errors
      if (error.code === 'ER_DUP_ENTRY') {
        let field = 'field'
        if (error.message.includes('email')) field = 'Email'
        else if (error.message.includes('full_name')) field = 'Full Name'
        else if (error.message.includes('contact_number')) field = 'Contact Number'

        return res.status(400).json({
          message: `Duplicate entry: ${field} already exists`,
          error: error.message,
        })
      }

      res.status(500).json({
        message: 'Error creating user',
        error: error.message,
      })
    } finally {
      connection.release()
    }
  },

  // Update user
  updateUser: async (req, res) => {
    const connection = await db.getConnection()
    try {
      const userId = req.params.id
      const { fullName, email, contactNumber, gender, dateOfBirth, password, role, status } =
        req.body

      await connection.beginTransaction()

      // Update user details
      let updateQuery = `
        UPDATE users 
        SET full_name = ?, email = ?, contact_number = ?,
            gender = ?, date_of_birth = ?, status = ?
        WHERE id = ?
      `
      let params = [fullName, email, contactNumber, gender, dateOfBirth, status, userId]

      // If password is provided, hash and update it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        updateQuery = `
          UPDATE users 
          SET full_name = ?, email = ?, contact_number = ?,
              gender = ?, date_of_birth = ?, password = ?, status = ?
          WHERE id = ?
        `
        params = [
          fullName,
          email,
          contactNumber,
          gender,
          dateOfBirth,
          hashedPassword,
          status,
          userId,
        ]
      }

      await connection.query(updateQuery, params)

      // Update role if provided
      if (role) {
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId])
        await connection.query('INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)', [
          userId,
          role,
        ])
      }

      await connection.commit()
      res.json({ message: 'User updated successfully' })
    } catch (error) {
      await connection.rollback()
      res.status(500).json({ message: error.message })
    } finally {
      connection.release()
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id
      await db.query('DELETE FROM users WHERE id = ?', [userId])
      res.json({ message: 'User deleted successfully' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id
      const query = `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.contact_number,
          u.gender,
          u.date_of_birth,
          u.status,
          u.created_at,
          u.last_modified,
          ur.role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = ?
      `

      const [user] = await db.query(query, [userId])

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'User not found' })
      }

      res.json(user[0])
    } catch (error) {
      console.error('Error getting user by ID:', error)
      res.status(500).json({ message: 'Error getting user details' })
    }
  },
}

module.exports = userController
