// BACKEND/src/test/verifyTables.js
const pool = require('../config/database')

async function verifyDatabaseSetup() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Connected to database successfully')

    // Check if tables exist
    const [tables] = await connection.query(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?`,
      [process.env.DB_NAME],
    )

    const expectedTables = ['employees', 'emergency_contacts', 'users']
    const existingTables = tables.map((t) => t.TABLE_NAME)

    console.log('\nChecking tables:')
    expectedTables.forEach((table) => {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`)
      } else {
        console.log(`❌ Table '${table}' is missing`)
      }
    })

    // Check table structures
    for (const table of existingTables) {
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM ${table}
      `)
      console.log(`\nStructure of '${table}' table:`)
      columns.forEach((col) => {
        console.log(`- ${col.Field}: ${col.Type}`)
      })
    }

    connection.release()
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

verifyDatabaseSetup()

async function testDatabase() {
  let connection
  try {
    connection = await pool.getConnection()
    console.log('✅ Database connected successfully')

    // Simple test queries
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
    `)

    console.log('\nExisting tables:')
    tables.forEach((table) => {
      console.log(`- ${table.TABLE_NAME}`)
    })
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

testDatabase()
