const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config()

let pool

if (process.env.JAWSDB_URL) {
  // Use JawsDB connection string on Heroku
  pool = mysql.createPool(process.env.JAWSDB_URL)
} else {
  // Use local .env variables
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
}

// Test the connection immediately
pool
  .getConnection()
  .then((connection) => {
    console.log('✅ Database connected successfully')
    connection.release()
  })
  .catch((err) => {
    console.error('❌ Error connecting to the database:', err.message)
  })

module.exports = pool
