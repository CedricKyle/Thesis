const pool = require('../config/database')
const bcrypt = require('bcryptjs')

async function syncUsersTable() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Get all employees that don't have corresponding user accounts
    const [employees] = await connection.query(`
      SELECT e.employee_id, e.email 
      FROM employees e 
      LEFT JOIN users u ON e.employee_id = u.employee_id 
      WHERE u.employee_id IS NULL
    `)

    console.log(`Found ${employees.length} employees without user accounts`)

    // Default password
    const defaultPassword = 'countryside123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Create user accounts for each employee
    for (const employee of employees) {
      await connection.query('INSERT INTO users (employee_id, email, password) VALUES (?, ?, ?)', [
        employee.employee_id,
        employee.email,
        hashedPassword,
      ])
      console.log(`Created user account for employee ${employee.employee_id}`)
    }

    await connection.commit()
    console.log('Successfully synchronized users table')
  } catch (error) {
    await connection.rollback()
    console.error('Error synchronizing users table:', error)
  } finally {
    connection.release()
  }
}

// Run the script
syncUsersTable()
