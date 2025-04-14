// BACKEND/src/server.js
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const employeeRoutes = require('./routes/main branch/employee-routes')
const path = require('path')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/employees', employeeRoutes)

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
