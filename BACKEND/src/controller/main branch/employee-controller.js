const {
  Employee,
  User,
  Role,
  EmergencyContact,
  sequelize,
  Position,
} = require('../../model/Index.js')
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
    // Handle both raw JSON and form-data formats
    let employeeData

    // If the data comes as form-data with employeeData field
    if (req.body.employeeData && typeof req.body.employeeData === 'string') {
      try {
        employeeData = JSON.parse(req.body.employeeData)
      } catch (e) {
        return res.status(400).json({
          message: 'Invalid employee data format',
          error: 'Failed to parse employeeData JSON',
        })
      }
    } else {
      // If the data comes as raw JSON
      employeeData = req.body
    }

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'department',
      'position_id',
      'role_id',
      'dateOfHire',
      'dateOfBirth',
      'gender',
      'contactNumber',
      'email',
      'address',
    ]

    const missingFields = requiredFields.filter((field) => !employeeData[field])
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields,
      })
    }

    // Add after parsing employeeData
    console.log('Parsed employeeData:', employeeData)
    console.log('Missing fields:', missingFields)

    // Handle profile image file
    let profileImagePath = null
    if (req.files?.profileImage?.[0]) {
      const profileFile = req.files.profileImage[0]
      // Validate file type
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedImageTypes.includes(profileFile.mimetype)) {
        return res.status(400).json({
          message: 'Invalid file type for profile image',
          allowedTypes: allowedImageTypes,
        })
      }
      profileImagePath = await saveFile(profileFile, 'profile')
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(employeeData.email)) {
      return res.status(400).json({
        message: 'Invalid email format',
      })
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({
      where: { email: employeeData.email },
    })

    if (existingEmail) {
      return res.status(400).json({
        message: 'Email already exists',
      })
    }

    // Verify role exists by ID
    const role = await Role.findOne({
      where: { id: employeeData.role_id },
      attributes: ['id', 'role_name', 'permissions', 'department'],
    })

    if (!role) {
      return res.status(400).json({
        message: 'Invalid role specified',
        error: 'Role does not exist',
      })
    }

    // Create employee with verified role_id
    const employee = await Employee.create(
      {
        employee_id: employeeId,
        first_name: employeeData.firstName,
        middle_name: employeeData.middleName,
        last_name: employeeData.lastName,
        full_name: fullName,
        department: employeeData.department,
        position_id: employeeData.position_id,
        role_id: role.id,
        date_of_hire: employeeData.dateOfHire,
        date_of_birth: employeeData.dateOfBirth,
        gender: employeeData.gender,
        contact_number: employeeData.contactNumber,
        email: employeeData.email,
        address: employeeData.address,
        profile_image_path: profileImagePath,
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
    const defaultPassword = employeeData.lastName.trim().toLowerCase()
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
      data: {
        employeeId,
        email: employeeData.email,
        fullName,
        profileImagePath,
        userCredentials: {
          username: employeeId,
          defaultPassword: defaultPassword,
        },
      },
    })

    // Add these debug logs right after the try block in createEmployee
    console.log('Request body:', req.body)
    console.log('Request files:', req.files)
    console.log('employeeData before parsing:', req.body.employeeData)
  } catch (error) {
    await t.rollback()
    console.error('Error creating employee:', error)

    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Duplicate entry found',
        error: error.errors[0].message,
      })
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: error.errors.map((e) => e.message),
      })
    }

    res.status(500).json({
      message: 'Something went wrong!',
      error: error.message,
    })
  }
}

const getAllEmployees = async (req, res) => {
  try {
    const { includeDeleted } = req.query

    // Set paranoid to false when includeDeleted is true to include soft-deleted records
    const employees = await Employee.findAll({
      paranoid: false, // This will include soft-deleted records
      include: [
        {
          model: EmergencyContact,
          as: 'emergencyContact',
          paranoid: false,
        },
        {
          model: Role,
          as: 'roleInfo',
          attributes: ['role_name', 'permissions', 'department'],
          paranoid: false,
        },
        {
          model: Position,
          as: 'positionInfo',
          paranoid: false,
        },
      ],
      order: [['created_at', 'DESC']],
    })

    const mappedEmployees = employees.map((employee) => {
      const employeeJson = employee.toJSON()
      return {
        ...employeeJson,
        permissions: employeeJson.roleInfo?.permissions || [],
        role_name: employeeJson.roleInfo?.role_name || '',
      }
    })

    res.json(mappedEmployees)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    })
  }
}

//get all employees by id
const getAllEmployeeById = async (req, res) => {
  try {
    // Get emergency contact with raw query since it works reliably
    const [emergencyContact] = await sequelize.query(
      `SELECT 
        id, employee_id, first_name, middle_name, last_name, 
        full_name, relationship, contact_number 
      FROM emergency_contacts 
      WHERE employee_id = ? AND deleted_at IS NULL`,
      {
        replacements: [req.params.id],
        type: sequelize.QueryTypes.SELECT,
      },
    )

    // Get employee data
    const employee = await Employee.findOne({
      where: {
        employee_id: req.params.id,
      },
      include: [
        {
          model: Role,
          as: 'roleInfo',
          attributes: ['role_name', 'permissions', 'department'],
        },
        {
          model: Position,
          as: 'positionInfo',
        },
      ],
    })

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const employeeData = employee.toJSON()

    // Format the response
    const formattedEmployee = {
      ...employeeData,
      emergencyContact: emergencyContact || null,
      permissions: employeeData.roleInfo?.permissions || [],
    }

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

    // Handle both raw JSON and form-data formats
    let employeeData
    if (req.body.employeeData && typeof req.body.employeeData === 'string') {
      try {
        employeeData = JSON.parse(req.body.employeeData)
      } catch (e) {
        return res.status(400).json({
          message: 'Invalid employee data format',
          error: 'Failed to parse employeeData JSON',
        })
      }
    } else {
      employeeData = req.body
    }

    console.log('Update data received:', employeeData) // Debug log

    // Generate full name
    const fullName = [employeeData.firstName, employeeData.middleName, employeeData.lastName]
      .filter(Boolean)
      .join(' ')

    // Handle profile image file
    let profileImagePath = null
    if (req.files?.profileImage?.[0]) {
      const profileFile = req.files.profileImage[0]
      profileImagePath = await saveFile(profileFile, 'profile')
    }

    // Update employee
    const [updatedCount] = await Employee.update(
      {
        first_name: employeeData.firstName,
        middle_name: employeeData.middleName,
        last_name: employeeData.lastName,
        full_name: fullName,
        department: employeeData.department,
        position_id: employeeData.position_id,
        role_id: employeeData.role_id,
        date_of_hire: employeeData.dateOfHire,
        date_of_birth: employeeData.dateOfBirth,
        gender: employeeData.gender,
        contact_number: employeeData.contactNumber,
        email: employeeData.email,
        address: employeeData.address,
        profile_image_path: profileImagePath,
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
      const emergencyContactFullName = [
        employeeData.emergencyContact.firstName,
        employeeData.emergencyContact.middleName,
        employeeData.emergencyContact.lastName,
      ]
        .filter(Boolean)
        .join(' ')

      await EmergencyContact.update(
        {
          first_name: employeeData.emergencyContact.firstName,
          middle_name: employeeData.emergencyContact.middleName,
          last_name: employeeData.emergencyContact.lastName,
          full_name: emergencyContactFullName,
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
        {
          model: Position,
          as: 'positionInfo',
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

    const [result] = await connection.execute(
      `INSERT INTO employees (
        employee_id, first_name, middle_name, last_name, full_name,
        department, position_id, role_id, date_of_hire, date_of_birth,
        gender, contact_number, email, address,
        profile_image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeData.id,
        employeeData.firstName,
        employeeData.middleName,
        employeeData.lastName,
        employeeData.fullName,
        employeeData.department,
        employeeData.position_id,
        employeeData.role_id,
        employeeData.dateOfHire,
        employeeData.dateOfBirth,
        employeeData.gender,
        employeeData.contactNumber,
        employeeData.email,
        employeeData.address,
        profilePath,
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
      employee: { ...employeeData, profile_image_path: profilePath },
    })
  } catch (error) {
    await connection.rollback()
    // Delete uploaded files if database operation fails
    if (req.files?.profileImage?.[0]) {
      await deleteFile(req.files.profileImage[0].path)
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
      'SELECT profile_image_path FROM employees WHERE employee_id = ?',
      [employeeData.id],
    )

    // Handle new files
    const profilePath = req.files?.profileImage?.[0]?.path || oldEmployee.profile_image_path

    // Delete old files if new ones are uploaded
    if (req.files?.profileImage?.[0] && oldEmployee.profile_image_path) {
      await deleteFile(oldEmployee.profile_image_path)
    }

    // Update employee record
    await connection.execute(
      `UPDATE employees SET
        profile_image_path = ?
      WHERE employee_id = ?`,
      [profilePath, employeeData.id],
    )

    await connection.commit()
    res.json({ message: 'Employee updated successfully' })
  } catch (error) {
    await connection.rollback()
    // Delete new uploaded files if update fails
    if (req.files?.profileImage?.[0]) {
      await deleteFile(req.files.profileImage[0].path)
    }
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
}

// Update profile image only
const updateProfileImage = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    // Get employee ID from request body
    const { employeeId } = req.body

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing employee ID',
      })
    }

    // Check if employee exists
    const employee = await Employee.findOne({
      where: { employee_id: employeeId },
      transaction: t,
    })

    if (!employee) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      })
    }

    // Handle profile image file
    if (!req.files?.profileImage?.[0]) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: 'No profile image provided',
      })
    }

    // Get the profile image file
    const profileFile = req.files.profileImage[0]

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedImageTypes.includes(profileFile.mimetype)) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: 'Invalid file type for profile image',
        allowedTypes: allowedImageTypes,
      })
    }

    // Save new file
    const profileImagePath = await saveFile(profileFile, 'profile')

    // Delete old file if exists and different
    if (employee.profile_image_path && profileImagePath !== employee.profile_image_path) {
      try {
        const oldFilePath = path.join(__dirname, '../../../', employee.profile_image_path)
        await fs.access(oldFilePath)
        await fs.unlink(oldFilePath)
      } catch (error) {
        console.error('Error deleting old profile image:', error)
        // Continue with update even if old file deletion fails
      }
    }

    // Update employee record
    await employee.update({ profile_image_path: profileImagePath }, { transaction: t })

    await t.commit()

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profile_image_path: profileImagePath,
    })
  } catch (error) {
    await t.rollback()
    console.error('Error updating profile image:', error)
    return res.status(500).json({
      success: false,
      message: 'Error updating profile image',
      error: error.message,
    })
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

    // First find the employee
    const employee = await Employee.findOne({
      where: { employee_id: employeeId },
      include: [
        { model: User, as: 'user' },
        { model: Role, as: 'roleInfo', attributes: ['permissions', 'role_name', 'department'] },
      ],
      paranoid: false,
    })

    if (!employee) {
      return res.status(401).json({
        message: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND',
      })
    }

    // Check if employee is archived (soft deleted)
    if (employee.deleted_at) {
      return res.status(403).json({
        message: 'Your account is archived. Please contact the administrator.',
        code: 'ACCOUNT_ARCHIVED',
      })
    }

    // Get user account
    let user = await User.findOne({
      where: { employee_id: employeeId },
      paranoid: false, // In case the user is also soft-deleted
    })

    // If no user account exists, create one
    if (!user) {
      // Use the employee's last name as the default password (lowercase, trimmed)
      const defaultPassword = employee.last_name.trim().toLowerCase()
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      user = await User.create({
        employee_id: employeeId,
        email: employee.email,
        password: hashedPassword,
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid password.',
        code: 'INVALID_PASSWORD',
      })
    }

    // Get permissions
    const permissions = employee.roleInfo?.permissions || []

    // Generate token
    const token = generateToken({
      employee_id: employee.employee_id,
      role: employee.roleInfo.role_name,
      department: employee.roleInfo.department,
      permissions: permissions,
    })

    // Set cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    // Send response
    res.json({
      message: 'Login successful',
      user: {
        ...employee.toJSON(),
        permissions: permissions,
        user: undefined,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error during login',
      error: error.message,
      code: 'LOGIN_ERROR',
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
    // Get employee_id from token
    const employeeId = req.user.employee_id

    // Fetch full employee info from DB
    const employee = await Employee.findOne({
      where: { employee_id: employeeId },
      include: [
        { model: Role, as: 'roleInfo', attributes: ['permissions', 'role_name', 'department'] },
      ],
    })

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Get fresh permissions from the database
    const [roles] = await connection.query('SELECT permissions FROM roles WHERE role_name = ?', [
      req.user.role,
    ])
    const permissions =
      typeof roles[0].permissions === 'string'
        ? JSON.parse(roles[0].permissions)
        : roles[0].permissions

    res.json({
      message: 'Token is valid',
      user: {
        ...employee.toJSON(),
        permissions: permissions,
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

// Update personal info (full name, phone number, birthday) without permission checks
const updatePersonalInfo = async (req, res) => {
  try {
    // Get employee ID from the token
    const employeeId = req.user.employee_id

    // Update only allowed fields (personal information)
    const { contactNumber, address, email } = req.body

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: 'Invalid email format',
        })
      }

      // Check if email already exists for a different employee
      const existingEmail = await Employee.findOne({
        where: {
          email,
          employee_id: { [Sequelize.Op.ne]: employeeId },
        },
      })

      if (existingEmail) {
        return res.status(400).json({
          message: 'Email already exists',
        })
      }
    }

    // Update employee
    await Employee.update(
      {
        contact_number: contactNumber,
        address,
        email,
      },
      {
        where: { employee_id: employeeId },
      },
    )

    // If email is changed, update the user account email as well
    if (email) {
      await User.update(
        { email },
        {
          where: { employee_id: employeeId },
        },
      )
    }

    // Send success response
    res.json({
      message: 'Personal information updated successfully',
    })
  } catch (error) {
    console.error('Error updating personal info:', error)
    res.status(500).json({
      message: 'Error updating personal information',
      error: error.message,
    })
  }
}

// Function to change employee password
const changePassword = async (req, res) => {
  try {
    const employeeId = req.user.employee_id
    const { currentPassword, newPassword, confirmPassword } = req.body

    // ...validation code...

    const user = await User.findOne({ where: { employee_id: employeeId } })
    if (!user) {
      return res.status(404).json({ message: 'User account not found' })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Update password (plain, NOT hashed)
    await user.update({ password: newPassword })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({
      message: 'Error changing password',
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
  updateProfileImage,
  updatePersonalInfo,
  changePassword,
}
