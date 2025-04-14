const Employee = require('../../model/main branch/employee-model')
const pool = require('../../config/database')
const { deleteFile } = require('../../utils/main branch/fileHandler')
const path = require('path')
const fs = require('fs').promises

exports.createEmployee = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Debug logging
    console.log('Request body:', req.body)
    console.log('Request files:', req.files)

    if (!req.body.employeeData) {
      throw new Error('Employee data is required')
    }

    let employeeData = JSON.parse(req.body.employeeData)

    // Handle profile image file
    let profileImagePath = null
    if (req.files && req.files.profileImage) {
      const profileFile = req.files.profileImage[0]
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      profileImagePath = `uploads/main branch/profiles/profile-${uniqueSuffix}${path.extname(profileFile.originalname)}`

      // Ensure directory exists
      const fullPath = path.join(__dirname, '../../../uploads/main branch/profiles')
      await fs.mkdir(fullPath, { recursive: true })

      // Save file to the correct location
      await fs.writeFile(path.join(__dirname, '../../../', profileImagePath), profileFile.buffer)
    }

    // Handle resume file
    let resumePath = null
    if (req.files && req.files.resume) {
      const resumeFile = req.files.resume[0]
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      resumePath = `uploads/main branch/resumes/resume-${uniqueSuffix}${path.extname(resumeFile.originalname)}`

      // Ensure directory exists
      await fs.mkdir(path.dirname(resumePath), { recursive: true })

      // Save file
      await fs.writeFile(resumePath, resumeFile.buffer)
    }

    // Validate required fields
    if (!employeeData || !employeeData.firstName) {
      throw new Error('Required employee data is missing')
    }

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
    } = employeeData

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

    // Insert employee with both profile and resume paths
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
      profile_image_path: profileImagePath,
      resume_path: resumePath,
    })

    // Insert emergency contact
    if (emergencyContact) {
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
    }

    await connection.commit()

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId,
      profileImagePath,
      resumePath,
    })
  } catch (error) {
    await connection.rollback()
    console.error('Error creating employee:', error)
    res.status(500).json({
      message: 'Something went wrong!',
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

// Add employee with files
exports.addEmployee = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const employeeData = JSON.parse(req.body.employeeData)
    const profilePath = req.files?.profileImage?.[0]?.path
    const resumePath = req.files?.resume?.[0]?.path

    const [result] = await connection.execute(
      `INSERT INTO employees (
        employee_id, first_name, middle_name, last_name, full_name,
        department, job_title, role, date_of_hire, date_of_birth,
        gender, contact_number, email, address,
        profile_image_path, resume_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeData.id,
        employeeData.firstName,
        employeeData.middleName,
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
        profilePath,
        resumePath,
      ],
    )

    // Insert emergency contact
    await connection.execute(
      `INSERT INTO emergency_contacts (
        employee_id, first_name, middle_name, last_name,
        full_name, relationship, contact_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeData.id,
        employeeData.emergencyContact.firstName,
        employeeData.emergencyContact.middleName,
        employeeData.emergencyContact.lastName,
        employeeData.emergencyContact.fullName,
        employeeData.emergencyContact.relationship,
        employeeData.emergencyContact.contactNumber,
      ],
    )

    await connection.commit()
    res.status(201).json({
      message: 'Employee added successfully',
      employee: { ...employeeData, profile_image_path: profilePath, resume_path: resumePath },
    })
  } catch (error) {
    await connection.rollback()
    // Delete uploaded files if database operation fails
    if (req.files?.profileImage?.[0]) {
      await deleteFile(req.files.profileImage[0].path)
    }
    if (req.files?.resume?.[0]) {
      await deleteFile(req.files.resume[0].path)
    }
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
}

// Update employee with files
exports.updateEmployeeWithFiles = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const employeeData = JSON.parse(req.body.employeeData)
    const oldEmployee = await connection.execute(
      'SELECT profile_image_path, resume_path FROM employees WHERE employee_id = ?',
      [employeeData.id],
    )

    // Handle new files
    const profilePath = req.files?.profileImage?.[0]?.path || oldEmployee.profile_image_path
    const resumePath = req.files?.resume?.[0]?.path || oldEmployee.resume_path

    // Delete old files if new ones are uploaded
    if (req.files?.profileImage?.[0] && oldEmployee.profile_image_path) {
      await deleteFile(oldEmployee.profile_image_path)
    }
    if (req.files?.resume?.[0] && oldEmployee.resume_path) {
      await deleteFile(oldEmployee.resume_path)
    }

    // Update employee record
    await connection.execute(
      `UPDATE employees SET
        profile_image_path = ?,
        resume_path = ?
      WHERE employee_id = ?`,
      [profilePath, resumePath, employeeData.id],
    )

    await connection.commit()
    res.json({ message: 'Employee updated successfully' })
  } catch (error) {
    await connection.rollback()
    // Delete new uploaded files if update fails
    if (req.files?.profileImage?.[0]) {
      await deleteFile(req.files.profileImage[0].path)
    }
    if (req.files?.resume?.[0]) {
      await deleteFile(req.files.resume[0].path)
    }
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
}

// Serve files
exports.getFile = async (req, res) => {
  try {
    const { type, filename } = req.params
    const filePath = path.join(__dirname, '../../../uploads/main branch', type + 's', filename)

    // Debug log
    console.log('Attempting to retrieve file:', filePath)
    console.log('__dirname:', __dirname)
    console.log('Full path:', filePath)

    try {
      await fs.access(filePath)

      // Set content type based on file extension
      const ext = path.extname(filename).toLowerCase()
      let contentType = 'application/octet-stream' // default content type

      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.gif':
          contentType = 'image/gif'
          break
      }

      // Set proper content type and send file
      res.contentType(contentType)
      res.sendFile(filePath)
    } catch (error) {
      console.error('File not found:', error)
      return res.status(404).json({ error: 'File not found' })
    }
  } catch (error) {
    console.error('Error retrieving file:', error)
    res.status(500).json({ error: 'Error retrieving file' })
  }
}
