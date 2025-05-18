const express = require('express')
const router = express.Router()
const controller = require('../../controller/main branch/production-distribution-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')
const { sequelize } = require('../../model/Index.js')

// Test endpoint to check database schema - accessible without auth
router.get('/test-schema', async (req, res) => {
  try {
    console.log('Testing database connection and schema');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection OK');
    
    // Get list of tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('Available tables:', tables);
    
    // Check sequelize models definition
    console.log('Sequelize models:', Object.keys(sequelize.models));
    
    // Get table structure
    const [requestTable] = await sequelize.query('DESCRIBE branch_distribution_requests');
    const [itemsTable] = await sequelize.query('DESCRIBE branch_distribution_request_items');
    
    // Check for any existing records
    const [requestsCount] = await sequelize.query('SELECT COUNT(*) as count FROM branch_distribution_requests');
    const [itemsCount] = await sequelize.query('SELECT COUNT(*) as count FROM branch_distribution_request_items');
    
    console.log('branch_distribution_requests count:', requestsCount[0].count);
    console.log('branch_distribution_request_items count:', itemsCount[0].count);
    
    // Return table structure and diagnostics
    return res.json({
      success: true,
      message: 'Database schema retrieved successfully',
      tables: tables,
      models: Object.keys(sequelize.models),
      counts: {
        requests: requestsCount[0].count,
        items: itemsCount[0].count
      },
      data: {
        branch_distribution_requests: requestTable,
        branch_distribution_request_items: itemsTable
      }
    });
  } catch (error) {
    console.error('Error testing schema:', error);
    return res.status(500).json({
      success: false,
      message: 'Database schema test failed',
      error: error.message
    });
  }
});

// Test endpoint to create a sample branch request
router.get('/create-test-request', async (req, res) => {
  try {
    console.log('Creating test branch distribution request');
    
    // Generate a unique request ID
    const request_id = `TEST-${new Date().getTime()}`;
    
    // Insert directly via SQL
    await sequelize.query(`
      INSERT INTO branch_distribution_requests 
      (request_id, branch_id, branch_name, status, requested_at, created_at, updated_at)
      VALUES 
      (?, 1, 'Test Branch', 'pending', NOW(), NOW(), NOW())
    `, {
      replacements: [request_id]
    });
    
    // Insert a test item
    await sequelize.query(`
      INSERT INTO branch_distribution_request_items
      (request_id, product_id, product_name, quantity, unit, created_at, updated_at)
      VALUES
      (?, 1, 'Test Product', 10, 'pcs', NOW(), NOW())
    `, {
      replacements: [request_id]
    });
    
    return res.json({
      success: true,
      message: 'Test branch distribution request created',
      request_id: request_id
    });
  } catch (error) {
    console.error('Error creating test request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test request',
      error: error.message
    });
  }
});

// Root path handler - returns all branch requests
router.get('/', controller.getBranchRequests)

// All routes below this are protected with token verification
router.use(verifyToken)

// Branch distribution requests routes
router.get('/branch-requests', controller.getBranchRequests)
router.get('/branch-request/:requestId', controller.getBranchRequestById)
router.get('/branch-request-items/:requestId', controller.getBranchRequestItems)
router.post('/branch-request', controller.createBranchRequest)
router.patch('/branch-request/:requestId/status', controller.updateBranchRequestStatus)

module.exports = router 