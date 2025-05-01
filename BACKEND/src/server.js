// BACKEND/src/server.js
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const employeeRoutes = require('./routes/main branch/employee-routes.js')
const roleRoutes = require('./routes/main branch/role-routes.js')
const attendanceRoutes = require('./routes/main branch/attendance-routes.js')
const inventoryRoutes = require('./routes/main branch/scm routes/inventory-routes.js')
const stockInRoutes = require('./routes/main branch/scm routes/stock-in-routes.js')
const stockOutRoutes = require('./routes/main branch/scm routes/stock-out-routes.js')
const stockAdjustmentRoutes = require('./routes/main branch/scm routes/stock-adjustment-routes.js')
const positionRoutes = require('./routes/main branch/employee-positions-routes.js')
const deductionRoutes = require('./routes/main branch/employee-deduction-routes.js')
const availableScheduleRoutes = require('./routes/main branch/available-schedule-routes.js')
const path = require('path')

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
    ],
    exposedHeaders: ['Set-Cookie'],
  }),
)

// Body parser middleware - BEFORE routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/employees', employeeRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/stock-in', stockInRoutes)
app.use('/api/stock-out', stockOutRoutes)
app.use('/api/stock-adjustment', stockAdjustmentRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/employee-deductions', deductionRoutes)
app.use('/api/available-schedules', availableScheduleRoutes)
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
