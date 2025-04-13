const Employee = require('../../model/main branch/employee-model')
const pool = require('../../config/database')

exports.createEmployee = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const {
      firstName,
      middleName,
      lastName,
      department,
      jobTitle,
      role,
      dateOfHire,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      address,
      emergencyContact,
    } = req.body

    // Generate employee ID (YYYY-50000 format)
    const hireYear = new Date(dateOfHire).getFullYear()
    const [existingEmployees] = await connection.query(
      'SELECT employee_id FROM employees WHERE employee_id LIKE ?',
      [`${hireYear}%`],
    )

    const nextNumber =
      existingEmployees.length > 0
        ? Math.max(...existingEmployees.map((emp) => parseInt(emp.employee_id.split('-')[1]))) + 1
        : 50000

    const employeeId = `${hireYear}-${nextNumber.toString().padStart(5, '0')}`
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')

    // Insert employee
    await connection.query(`INSERT INTO employees SET ?`, {
      employee_id: employeeId,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      full_name: fullName,
      department,
      job_title: jobTitle,
      role,
      date_of_hire: dateOfHire,
      date_of_birth: dateOfBirth,
      gender,
      contact_number: contactNumber,
      email,
      address,
    })

    // Insert emergency contact
    await connection.query(`INSERT INTO emergency_contacts SET ?`, {
      employee_id: employeeId,
      first_name: emergencyContact.firstName,
      middle_name: emergencyContact.middleName || null,
      last_name: emergencyContact.lastName,
      full_name: [
        emergencyContact.firstName,
        emergencyContact.middleName,
        emergencyContact.lastName,
      ]
        .filter(Boolean)
        .join(' '),
      relationship: emergencyContact.relationship,
      contact_number: emergencyContact.contactNumber,
    })

    // Create user account with default password
    const bcrypt = require('bcrypt')
    const hashedPassword = await bcrypt.hash('countryside123', 10)

    await connection.query(`INSERT INTO users SET ?`, {
      employee_id: employeeId,
      email,
      password: hashedPassword,
    })

    await connection.commit()

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId,
      email,
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error creating employee:', error)
    res.status(500).json({
      message: 'Error creating employee',
      error: error.message,
    })
  } finally {
    connection.release()
  }
}

exports.getAllEmployees = async (req, res) => {
  try {
    // First get employees
    const [employees] = await pool.query(`
      SELECT 
        e.*,
        ec.first_name as emergency_contact_first_name,
        ec.middle_name as emergency_contact_middle_name,
        ec.last_name as emergency_contact_last_name,
        ec.full_name as emergency_contact_full_name,
        ec.relationship as emergency_contact_relationship,
        ec.contact_number as emergency_contact_number
      FROM employees e
      LEFT JOIN emergency_contacts ec ON e.employee_id = ec.employee_id
    `)

    // Format the response
    const formattedEmployees = employees.map((employee) => {
      const {
        emergency_contact_first_name,
        emergency_contact_middle_name,
        emergency_contact_last_name,
        emergency_contact_full_name,
        emergency_contact_relationship,
        emergency_contact_number,
        ...employeeData
      } = employee

      return {
        ...employeeData,
        emergencyContact: {
          firstName: emergency_contact_first_name,
          middleName: emergency_contact_middle_name,
          lastName: emergency_contact_last_name,
          fullName: emergency_contact_full_name,
          relationship: emergency_contact_relationship,
          contactNumber: emergency_contact_number,
        },
      }
    })

    res.json(formattedEmployees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    })
  }
}

//get all employees by id
exports.getAllEmployeeById = async (req, res) => {
  try {
    const [employees] = await pool.query(
      `
      SELECT 
        e.*,
        ec.first_name as emergency_contact_first_name,
        ec.middle_name as emergency_contact_middle_name,
        ec.last_name as emergency_contact_last_name,
        ec.full_name as emergency_contact_full_name,
        ec.relationship as emergency_contact_relationship,
        ec.contact_number as emergency_contact_number
      FROM employees e
      LEFT JOIN emergency_contacts ec ON e.employee_id = ec.employee_id
      WHERE e.employee_id = ?
    `,
      [req.params.id],
    )

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const employee = employees[0]
    const {
      emergency_contact_first_name,
      emergency_contact_middle_name,
      emergency_contact_last_name,
      emergency_contact_full_name,
      emergency_contact_relationship,
      emergency_contact_number,
      ...employeeData
    } = employee

    const formattedEmployee = {
      ...employeeData,
      emergencyContact: {
        firstName: emergency_contact_first_name,
        middleName: emergency_contact_middle_name,
        lastName: emergency_contact_last_name,
        fullName: emergency_contact_full_name,
        relationship: emergency_contact_relationship,
        contactNumber: emergency_contact_number,
      },
    }

    res.json(formattedEmployee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    res.status(500).json({
      message: 'Error fetching employee',
      error: error.message,
    })
  }
}

//update employee
exports.updateEmployee = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const { id } = req.params
    const { emergencyContact } = req.body

    if (emergencyContact) {
      // Update emergency contact
      await connection.query('UPDATE emergency_contacts SET ? WHERE employee_id = ?', [
        {
          first_name: emergencyContact.firstName,
          middle_name: emergencyContact.middleName || null,
          last_name: emergencyContact.lastName,
          full_name: [
            emergencyContact.firstName,
            emergencyContact.middleName,
            emergencyContact.lastName,
          ]
            .filter(Boolean)
            .join(' '),
          relationship: emergencyContact.relationship,
          contact_number: emergencyContact.contactNumber,
        },
        id,
      ])
    }

    await connection.commit()
    res.json({
      message: 'Emergency contact updated successfully',
      employeeId: id,
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error updating emergency contact:', error)
    res.status(500).json({
      message: 'Error updating emergency contact',
      error: error.message,
    })
  } finally {
    connection.release()
  }
}

//delete employee
exports.deleteEmployee = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Delete user account first (due to foreign key constraint)
    await connection.query('DELETE FROM users WHERE employee_id = ?', [req.params.id])

    // Delete emergency contact
    await connection.query('DELETE FROM emergency_contacts WHERE employee_id = ?', [req.params.id])

    // Delete employee
    await connection.query('DELETE FROM employees WHERE employee_id = ?', [req.params.id])

    await connection.commit()
    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({
      message: 'Error deleting employee',
      error: error.message,
    })
  } finally {
    connection.release()
  }
}
