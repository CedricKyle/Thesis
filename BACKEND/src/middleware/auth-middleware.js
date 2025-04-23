import jwt from 'jsonwebtoken'

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.employee_id,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  )
}

export const verifyToken = (req, res, next) => {
  try {
    // Get token from cookies instead of headers
    const token = req.cookies.jwt

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export const clearToken = (res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
