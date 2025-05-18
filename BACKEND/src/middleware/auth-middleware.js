const jwt = require('jsonwebtoken')
const pool = require('../config/database.js')

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.employee_id,
      employee_id: user.employee_id,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  )
}

const verifyToken = async (req, res, next) => {
  try {
    let token = null

    // 1. Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    // 2. Fallback: Check cookie
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [employees] = await pool.query(
      `SELECT 
        e.*,
        r.role_name,
        r.department,
        r.permissions
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      WHERE e.employee_id = ?`,
      [decoded.id],
    )

    if (employees.length === 0) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      })
    }

    const currentUser = employees[0]
    const currentPermissions =
      typeof currentUser.permissions === 'string'
        ? JSON.parse(currentUser.permissions)
        : currentUser.permissions

    if (currentUser.deleted_at) {
      return res.status(403).json({
        message: 'Your account is archived. Please contact the administrator.',
        code: 'ACCOUNT_ARCHIVED',
      })
    }

    if (decoded.role !== currentUser.role_name) {
      return res.status(403).json({
        message: 'Your role has been changed',
        code: 'ROLE_CHANGED',
      })
    }

    req.user = {
      ...decoded,
      role: currentUser.role_name,
      department: currentUser.department,
      permissions: currentPermissions,
    }

    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    })
  }
}

const clearToken = (res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

module.exports = {
  generateToken,
  clearToken,
  verifyToken,
}
