const express = require('express')
const cors = require('cors')
const adminProductRoutes = require('./routes/admin routes/inventory/product.routes')
const errorMiddleware = require('./middleware/error.middleware')

const app = express()
const PORT = process.env.PORT || 3000

//middleware
app.use(cors())
app.use(express.json())

//Routes
//Admin Table Routes
app.use('/api/products', adminProductRoutes)

//error handling
app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
