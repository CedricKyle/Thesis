import pool from '../../config/database.js'
import bcrypt from 'bcrypt'

class Employee {
  static async createEmployee(employeeData, emergencyContact) {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Insert employee - Updated columns
      const [employeeResult] = await connection.execute(
        `INSERT INTO employees (
          employee_id, first_name, middle_name, last_name, full_name,
          department, job_title, role, date_of_hire, date_of_birth,
          gender, contact_number, email, address, profile_image_path, resume_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeData.id,
          employeeData.firstName,
          employeeData.middleName || null,
          employeeData.lastName,
          employeeData.fullName,
          employeeData.department,
          employeeData.jobTitle,
          employeeData.role,
          employeeData.dateOfHire,
          employeeData.dateOfBirth,
          employeeData.gender,
          employeeData.contactNumber,
          employeeData.email,
          employeeData.address,
          employeeData.profile_image_path || null, // Changed from profileImage
          employeeData.resume_path || null, // Changed from resume
        ],
      )

      // Insert emergency contact
      await connection.execute(
        `INSERT INTO emergency_contacts (
              employee_id, first_name, middle_name, last_name, full_name,
              relationship, contact_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeData.id,
          emergencyContact.firstName,
          emergencyContact.middleName || null,
          emergencyContact.lastName,
          emergencyContact.fullName,
          emergencyContact.relationship,
          emergencyContact.contactNumber,
        ],
      )

      //hash password
      const defaultPassword = 'countryside123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      //create user account with default password
      await connection.execute(
        `INSERT INTO users (
          employee_id, email, password
        ) VALUES (?, ?, ?)`,
        [employeeData.id, employeeData.email, hashedPassword],
      )

      await connection.commit()
      return employeeResult
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM employees')
    return rows
  }

  static async findById(employeeId) {
    const [rows] = await pool.query('SELECT * FROM employees WHERE employee_id = ?', [employeeId])
    return rows[0]
  }

  static async getEmergencyContact(employeeId) {
    const [rows] = await pool.query('SELECT * FROM emergency_contacts WHERE employee_id = ?', [
      employeeId,
    ])
    return rows[0]
  }

  static async getEmployeesByYear(year) {
    const [rows] = await pool.query('SELECT * FROM employees WHERE employee_id LIKE ?', [
      `${year}%`,
    ])
    return rows
  }

  static async getUserByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    return rows[0]
  }

  static async updateEmployee(employeeId, employeeData) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      await connection.query('UPDATE employees SET ? WHERE employee_id = ?', [
        employeeData,
        employeeId,
      ])

      if (employeeData.emergencyContact) {
        await connection.query('UPDATE emergency_contacts SET ? WHERE employee_id = ?', [
          employeeData.emergencyContact,
          employeeId,
        ])
      }

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async deleteEmployee(employeeId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      await connection.query('DELETE FROM users WHERE employee_id = ?', [employeeId])

      await connection.query('DELETE FROM emergency_contacts WHERE employee_id = ?', [employeeId])

      await connection.query('DELETE FROM employees WHERE employee_id = ?', [employeeId])

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

export default Employee
