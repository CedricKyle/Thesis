const { Employee, User, Role, EmergencyContact, sequelize } = require('../../model/Index.js')
const pool = require('../../config/database.js')
const { deleteFile, saveFile } = require('../../utils/main branch/fileHandler.js')
const path = require('path')
const fs = require('fs').promises
const bcrypt = require('bcrypt')
const { generateToken, clearToken } = require('../../middleware/auth-middleware.js')
const { Sequelize } = require('sequelize')

// Define all the controller functions
const createEmployee = async (req, res) => {
  const t = await sequelize.transaction()

  try {
    // Accept JSON data directly
    const employeeData = req.body

    if (!employeeData) {
      throw new Error('Employee data is required')
    }

    // Handle profile image file
    let profileImagePath = null
    if (req.files?.profileImage?.[0]) {
      const profileFile = req.files.profileImage[0]
      profileImagePath = await saveFile(profileFile, 'profile')
    }

    // Handle resume file
    let resumePath = null
    if (req.files?.resume?.[0]) {
      const resumeFile = req.files.resume[0]
      resumePath = await saveFile(resumeFile, 'resume')
    }

    // Generate employee ID
    const hireYear = new Date(employeeData.dateOfHire).getFullYear()
    const existingEmployees = await Employee.findAll({
      where: {
        employee_id: {
          [Sequelize.Op.like]: `${hireYear}%`,
        },
      },
    })

    const nextNumber =
      existingEmployees.length > 0
        ? Math.max(...existingEmployees.map((emp) => parseInt(emp.employee_id.split('-')[1]))) + 1
        : 50000

    const employeeId = `${hireYear}-${nextNumber.toString().padStart(5, '0')}`
    const fullName = [employeeData.firstName, employeeData.middleName, employeeData.lastName]
      .filter(Boolean)
      .join(' ')

    // Create employee
    const employee = await Employee.create(
      {
        employee_id: employeeId,
        first_name: employeeData.firstName,
        middle_name: employeeData.middleName,
        last_name: employeeData.lastName,
        full_name: fullName,
        department: employeeData.department,
        job_title: employeeData.jobTitle,
        role: employeeData.role,
        date_of_hire: employeeData.dateOfHire,
        date_of_birth: employeeData.dateOfBirth,
        gender: employeeData.gender,
        contact_number: employeeData.contactNumber,
        email: employeeData.email,
        address: employeeData.address,
        profile_image_path: profileImagePath,
        resume_path: resumePath,
      },
      { transaction: t },
    )

    // Create emergency contact
    if (employeeData.emergencyContact) {
      const emergencyContactFullName = [
        employeeData.emergencyContact.firstName,
        employeeData.emergencyContact.middleName,
        employeeData.emergencyContact.lastName,
      ]
        .filter(Boolean)
        .join(' ')

      await EmergencyContact.create(
        {
          employee_id: employeeId,
          first_name: employeeData.emergencyContact.firstName,
          middle_name: employeeData.emergencyContact.middleName,
          last_name: employeeData.emergencyContact.lastName,
          full_name: emergencyContactFullName,
          relationship: employeeData.emergencyContact.relationship,
          contact_number: employeeData.emergencyContact.contactNumber,
        },
        { transaction: t },
      )
    }

    // Create user account
    const defaultPassword = 'countryside123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    await User.create(
      {
        employee_id: employeeId,
        email: employeeData.email,
        password: hashedPassword,
      },
      { transaction: t },
    )

    await t.commit()

    res.status(201).json({
      message: 'Employee and user account created successfully',
      employeeId,
      profileImagePath,
      resumePath,
      userCredentials: {
        username: employeeId,
        defaultPassword: 'countryside123',
      },
    })
  } catch (error) {
    await t.rollback()
    console.error('Error creating employee:', error)
    res.status(500).json({
      message: 'Something went wrong!',
      error: error.message,
    })
  }
}

const getAllEmployees = async (req, res) => {
  try {
    const { includeDeleted } = req.query

    const employees = await Employee.findAll({
      paranoid: includeDeleted === 'true' ? false : true,
      include: [
        {
          model: EmergencyContact,
          as: 'emergencyContact',
          paranoid: includeDeleted === 'true' ? false : true,
        },
        {
          model: Role,
          as: 'roleInfo',
          attributes: ['permissions'],
          paranoid: includeDeleted === 'true' ? false : true,
        },
      ],
      order: [['created_at', 'DESC']],
    })

    // Map the employees to include permissions and is_deleted flag
    const mappedEmployees = employees.map((employee) => {
      const employeeJson = employee.toJSON()
      return {
        ...employeeJson,
        permissions: employeeJson.roleInfo?.permissions || [],
        is_deleted: employee.deleted_at !== null,
        roleInfo: undefined, // Remove roleInfo from response
      }
    })

    res.json(mappedEmployees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    })
  }
}

//get all employees by id
const getAllEmployeeById = async (req, res) => {
  try {
    console.log('Getting employee by ID:', req.params.id)

    // First, let's check if emergency contact exists with raw query
    const [emergencyContacts] = await sequelize.query(
      `SELECT * FROM emergency_contacts WHERE employee_id = ? AND deleted_at IS NULL`,
      {
        replacements: [req.params.id],
        type: sequelize.QueryTypes.SELECT,
      },
    )
    console.log('Raw emergency contact query:', JSON.stringify(emergencyContacts, null, 2))

    const employee = await Employee.findOne({
      where: {
        employee_id: req.params.id,
      },
      include: [
        {
          model: EmergencyContact,
          as: 'emergencyContact',
          required: false,
          attributes: [
            'id',
            'employee_id',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'relationship',
            'contact_number',
            'deleted_at',
          ],
        },
        {
          model: Role,
          as: 'roleInfo',
          attributes: ['permissions'],
        },
      ],
    })

    console.log('Raw employee data:', JSON.stringify(employee, null, 2))

    if (!employee) {
      console.log('No employee found')
      return res.status(404).json({ message: 'Employee not found' })
    }

    const employeeData = employee.toJSON()

    // Manually set emergency contact if it exists
    if (emergencyContacts) {
      employeeData.emergencyContact = emergencyContacts
    }

    const formattedEmployee = {
      ...employeeData,
      permissions: employeeData.roleInfo?.permissions || [],
      roleInfo: undefined,
    }

    console.log('Final formatted response:', JSON.stringify(formattedEmployee, null, 2))

    res.json(formattedEmployee)
  } catch (error) {
    console.error('Error in getAllEmployeeById:', error)
    res.status(500).json({
      message: 'Error fetching employee',
      error: error.message,
    })
  }
}

//update employee
const updateEmployee = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params
    const employeeData = req.body

    console.log('Update data received:', employeeData) // Debug log

    // Handle profile image file
    let profileImagePath = null
    if (req.files?.profileImage?.[0]) {
      const profileFile = req.files.profileImage[0]
      profileImagePath = await saveFile(profileFile, 'profile')
    }

    // Handle resume file
    let resumePath = null
    if (req.files?.resume?.[0]) {
      const resumeFile = req.files.resume[0]
      resumePath = await saveFile(resumeFile, 'resume')
    }

    // Update employee
    const [updatedCount] = await Employee.update(
      {
        first_name: employeeData.firstName,
        middle_name: employeeData.middleName,
        last_name: employeeData.lastName,
        full_name: [employeeData.firstName, employeeData.middleName, employeeData.lastName]
          .filter(Boolean)
          .join(' '),
        department: employeeData.department,
        job_title: employeeData.jobTitle,
        role: employeeData.role,
        date_of_hire: employeeData.dateOfHire,
        date_of_birth: employeeData.dateOfBirth,
        gender: employeeData.gender,
        contact_number: employeeData.contactNumber,
        email: employeeData.email,
        address: employeeData.address,
        ...(profileImagePath && { profile_image_path: profileImagePath }),
        ...(resumePath && { resume_path: resumePath }),
      },
      {
        where: { employee_id: id },
        transaction: t,
      },
    )

    if (updatedCount === 0) {
      await t.rollback()
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Update emergency contact if provided
    if (employeeData.emergencyContact) {
      await EmergencyContact.update(
        {
          first_name: employeeData.emergencyContact.firstName,
          middle_name: employeeData.emergencyContact.middleName,
          last_name: employeeData.emergencyContact.lastName,
          full_name: [
            employeeData.emergencyContact.firstName,
            employeeData.emergencyContact.middleName,
            employeeData.emergencyContact.lastName,
          ]
            .filter(Boolean)
            .join(' '),
          relationship: employeeData.emergencyContact.relationship,
          contact_number: employeeData.emergencyContact.contactNumber,
        },
        {
          where: { employee_id: id },
          transaction: t,
        },
      )
    }

    await t.commit()

    // Fetch updated employee data
    const updatedEmployee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        {
          model: EmergencyContact,
          as: 'emergencyContact',
          attributes: [
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'relationship',
            'contact_number',
          ],
        },
      ],
    })

    res.json({
      message: 'Employee updated successfully',
      data: updatedEmployee,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error updating employee:', error)
    res.status(500).json({
      message: 'Something went wrong!',
      error: error.message,
    })
  }
}

//delete employee
const deleteEmployee = async (req, res) => {
  let t = null
  try {
    t = await sequelize.transaction()
    const { id } = req.params
    const { force } = req.query

    // Find the employee first to check if they exist
    const employee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: EmergencyContact,
          as: 'emergencyContact',
        },
      ],
      paranoid: false,
    })

    if (!employee) {
      throw new Error('Employee not found')
    }

    const now = new Date()

    if (force === 'true') {
      // Hard delete - delete all related records
      if (employee.user) {
        await User.destroy({
          where: { employee_id: id },
          force: true,
          transaction: t,
        })
      }

      await EmergencyContact.destroy({
        where: { employee_id: id },
        force: true,
        transaction: t,
      })

      await Employee.destroy({
        where: { employee_id: id },
        force: true,
        transaction: t,
      })
    } else {
      // Soft delete - mark all related records as deleted
      // First update emergency contact
      await EmergencyContact.update(
        { deleted_at: now },
        {
          where: { employee_id: id },
          transaction: t,
        },
      )

      // Then update user if exists
      if (employee.user) {
        await User.update(
          { deleted_at: now },
          {
            where: { employee_id: id },
            transaction: t,
          },
        )
      }

      // Finally update employee
      await Employee.update(
        { deleted_at: now },
        {
          where: { employee_id: id },
          transaction: t,
        },
      )
    }

    await t.commit()

    // For immediate verification, fetch both records
    const [updatedEmployee, updatedContact] = await Promise.all([
      Employee.findOne({
        where: { employee_id: id },
        paranoid: false,
      }),
      EmergencyContact.findOne({
        where: { employee_id: id },
        paranoid: false,
      }),
    ])

    res.json({
      message: force === 'true' ? 'Employee permanently deleted' : 'Employee archived successfully',
      employeeId: id,
      deleted_at: updatedEmployee?.deleted_at,
      emergency_contact_deleted_at: updatedContact?.deleted_at,
    })
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback()
    }
    console.error('Error deleting employee:', error)
    res.status(500).json({
      message: error.message === 'Employee not found' ? error.message : 'Error deleting employee',
      error: error.message,
    })
  }
}

// Add employee with files
const addEmployee = async (req, res) => {
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
const updateEmployeeWithFiles = async (req, res) => {
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
const getFile = async (req, res) => {
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

const login = async (req, res) => {
  try {
    const { employeeId, password } = req.body
    console.log('Login attempt for employee:', employeeId)

    // First find the employee with user data
    const employee = await Employee.findOne({
      where: { employee_id: employeeId },
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: Role,
          as: 'roleInfo',
          attributes: ['permissions'],
        },
      ],
    })

    if (!employee) {
      return res.status(401).json({ message: 'Employee not found' })
    }

    // Find existing user
    const existingUser = await User.findOne({
      where: { employee_id: employeeId },
    })

    if (!existingUser) {
      // Create new user account
      const defaultPassword = 'countryside123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      try {
        await User.create({
          employee_id: employeeId,
          email: employee.email,
          password: hashedPassword,
        })

        if (password !== defaultPassword) {
          return res.status(401).json({
            message: 'New account created. Please login with the default password: countryside123',
          })
        }
      } catch (createError) {
        console.error('Error creating user:', createError)
        return res.status(500).json({
          message: 'Error creating user account',
          error: createError.message,
        })
      }
    }

    // Get fresh user data
    const user = await User.findOne({
      where: { employee_id: employeeId },
    })

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' })
    }

    // Get permissions
    const permissions = employee.roleInfo?.permissions || []

    // Generate token
    const token = generateToken({
      employee_id: employee.employee_id,
      role: employee.role,
      department: employee.department,
      permissions,
    })

    // Set cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    // Prepare response data
    const responseData = employee.toJSON()
    delete responseData.user // Remove sensitive data

    res.json({
      message: 'Login successful',
      user: {
        ...responseData,
        permissions,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      message: 'Error during login',
      error: error.message,
    })
  }
}

const logout = async (req, res) => {
  clearToken(res)
  res.json({ message: 'Logged out successfully' })
}

const verifyToken = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    // Get fresh permissions from the database
    const [roles] = await connection.query('SELECT permissions FROM roles WHERE role_name = ?', [
      req.user.role,
    ])

    if (roles.length === 0) {
      throw new Error('Role not found')
    }

    // Parse permissions if they're stored as a string
    const permissions =
      typeof roles[0].permissions === 'string'
        ? JSON.parse(roles[0].permissions)
        : roles[0].permissions

    res.json({
      message: 'Token is valid',
      user: {
        ...req.user,
        permissions: permissions, // Include fresh permissions in the response
      },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({ message: 'Token verification failed' })
  } finally {
    connection.release()
  }
}

// Add restore employee function
const restoreEmployee = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params

    // First check if the employee exists (including deleted)
    const employee = await Employee.findOne({
      where: { employee_id: id },
      paranoid: false,
    })

    if (!employee) {
      await t.rollback()
      return res.status(404).json({ message: 'Employee not found' })
    }

    if (!employee.deleted_at) {
      await t.rollback()
      return res.status(400).json({ message: 'Employee is not deleted' })
    }

    // Restore by setting deleted_at to null
    await Employee.update(
      { deleted_at: null },
      {
        where: { employee_id: id },
        transaction: t,
      },
    )

    // Restore related records
    await EmergencyContact.update(
      { deleted_at: null },
      {
        where: { employee_id: id },
        transaction: t,
      },
    )

    await User.update(
      { deleted_at: null },
      {
        where: { employee_id: id },
        transaction: t,
      },
    )

    await t.commit()

    // Fetch the restored employee
    const restoredEmployee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        {
          model: EmergencyContact,
          as: 'emergencyContact',
        },
      ],
    })

    res.json({
      message: 'Employee restored successfully',
      employeeId: id,
      employee: restoredEmployee,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error restoring employee:', error)
    res.status(500).json({
      message: 'Error restoring employee',
      error: error.message,
    })
  }
}

const checkEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params

    // Find emergency contact including soft-deleted records
    const emergencyContact = await EmergencyContact.findOne({
      where: { employee_id: id },
      paranoid: false,
    })

    if (!emergencyContact) {
      return res.status(404).json({ message: 'Emergency contact not found' })
    }

    res.json({
      message: 'Emergency contact found',
      data: emergencyContact,
    })
  } catch (error) {
    console.error('Error checking emergency contact:', error)
    res.status(500).json({
      message: 'Error checking emergency contact',
      error: error.message,
    })
  }
}

const restoreEmergencyContact = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params

    // Update deleted_at to null for the emergency contact
    await EmergencyContact.update(
      { deleted_at: null },
      {
        where: { employee_id: id },
        transaction: t,
      },
    )

    await t.commit()

    // Verify the restoration
    const restoredContact = await EmergencyContact.findOne({
      where: { employee_id: id },
    })

    res.json({
      message: 'Emergency contact restored successfully',
      data: restoredContact,
    })
  } catch (error) {
    await t.rollback()
    res.status(500).json({
      message: 'Error restoring emergency contact',
      error: error.message,
    })
  }
}

// Export all functions
module.exports = {
  createEmployee,
  getAllEmployees,
  getAllEmployeeById,
  updateEmployee,
  deleteEmployee,
  addEmployee,
  updateEmployeeWithFiles,
  getFile,
  login,
  logout,
  verifyToken,
  restoreEmployee,
  checkEmergencyContact,
  restoreEmergencyContact,
}
