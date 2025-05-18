const { sequelize, BranchDistributionRequest, BranchDistributionRequestItem } = require('../../model/Index.js')
const { Op } = require('sequelize')

const productionDistributionController = {
  // Get all branch distribution requests
  async getBranchRequests(req, res) {
    try {
      console.log('Fetching all branch distribution requests');
      console.log('Models available:', Object.keys(sequelize.models));
      
      // Try a direct SQL query as a fallback
      try {
        const [requests] = await sequelize.query(`
          SELECT 
            bdr.*, 
            COUNT(bdri.id) as total_items,
            GROUP_CONCAT(DISTINCT bdri.product_name) as product_names
          FROM branch_distribution_requests bdr
          LEFT JOIN branch_distribution_request_items bdri ON bdr.request_id = bdri.request_id
          GROUP BY bdr.id
          ORDER BY bdr.requested_at DESC
        `);
        
        console.log(`Found ${requests.length} branch distribution requests via direct SQL`);
        console.log('First request sample:', requests.length > 0 ? JSON.stringify(requests[0]) : 'No requests');
        
        // If direct SQL works but Sequelize ORM doesn't, return the SQL results
        if (requests && requests.length > 0) {
          return res.json({
            success: true,
            data: requests,
            source: 'direct_sql'
          });
        }
      } catch (sqlError) {
        console.error('Error in direct SQL query:', sqlError);
      }
      
      // If we get here, try the original Sequelize approach
      try {
        const requests = await BranchDistributionRequest.findAll({
          include: [{
            model: BranchDistributionRequestItem,
            as: 'items'
          }],
          order: [['requested_at', 'DESC']]
        });
        
        console.log(`Found ${requests.length} branch distribution requests via Sequelize ORM`);
        return res.json({
          success: true,
          data: requests,
          source: 'sequelize_orm'
        });
      } catch (queryError) {
        console.error('Error in Sequelize findAll query:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('Error getting branch distribution requests:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get branch distribution requests',
        error: error.message
      });
    }
  },
  
  // Get a specific branch distribution request by ID
  async getBranchRequestById(req, res) {
    try {
      const { requestId } = req.params;
      
      const request = await BranchDistributionRequest.findOne({
        where: { 
          [Op.or]: [
            { id: isNaN(requestId) ? -1 : requestId },
            { request_id: requestId }
          ]
        },
        include: [{
          model: BranchDistributionRequestItem,
          as: 'items'
        }]
      });
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Branch distribution request not found'
        });
      }
      
      return res.json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('Error getting branch distribution request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get branch distribution request',
        error: error.message
      });
    }
  },
  
  // Get items for a specific branch distribution request
  async getBranchRequestItems(req, res) {
    try {
      const { requestId } = req.params;
      
      const items = await BranchDistributionRequestItem.findAll({
        where: { request_id: requestId }
      });
      
      return res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error getting branch distribution request items:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get branch distribution request items',
        error: error.message
      });
    }
  },
  
  // Create a new branch distribution request
  async createBranchRequest(req, res) {
    try {
      console.log('Creating branch distribution request with data:', JSON.stringify(req.body, null, 2));
      
      const { branch_id, branch_name, remarks, items } = req.body;
      
      // Basic validation
      if (!branch_id || !branch_name || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID, branch name, and at least one item are required'
        });
      }
      
      // Generate a unique request ID
      const request_id = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      console.log('Generated request_id:', request_id);
      
      // Get current date for requested_at
      const currentDate = new Date();

      // First try to use direct SQL to see the exact column names in the table
      try {
        const [tableInfo] = await sequelize.query('DESCRIBE branch_distribution_requests');
        console.log('Table structure:', tableInfo.map(col => col.Field));
        
        // Create request data dynamically based on available columns
        const columns = tableInfo.map(col => col.Field);
        const requestData = {
          request_id: request_id,
          branch_id: branch_id,
          branch_name: branch_name,
          status: 'pending',
          remarks: remarks || '',
        };
        
        // Only add fields that actually exist in the table
        if (columns.includes('requested_at')) {
          requestData.requested_at = currentDate;
        }
        
        // Use direct SQL insertion to avoid model validation issues
        await sequelize.query(
          `INSERT INTO branch_distribution_requests (request_id, branch_id, branch_name, status, remarks, requested_at) 
           VALUES (?, ?, ?, 'pending', ?, ?)`,
          {
            replacements: [
              request_id,
              branch_id,
              branch_name,
              remarks || '',
              currentDate
            ]
          }
        );
        
        console.log('Request created with ID:', request_id);
        
        // Now create the items using direct SQL
        const requestItems = [];
        for (const item of items) {
          await sequelize.query(
            `INSERT INTO branch_distribution_request_items 
             (request_id, product_id, product_name, quantity, unit, category, notes, fulfilled_quantity) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            {
              replacements: [
                request_id,
                item.product_id || 0,
                item.product_name,
                item.quantity || 1,
                item.unit || 'pcs',
                item.category || 'Others',
                item.notes || ''
              ]
            }
          );
          
          requestItems.push({
            request_id,
            product_id: item.product_id || 0,
            product_name: item.product_name,
            quantity: item.quantity || 1,
            unit: item.unit || 'pcs',
            category: item.category || 'Others',
            notes: item.notes || '',
            fulfilled_quantity: 0
          });
        }
        
        return res.status(201).json({
          success: true,
          message: 'Branch distribution request created successfully',
          data: {
            request: {
              request_id,
              branch_id,
              branch_name,
              status: 'pending',
              remarks: remarks || ''
            },
            items: requestItems
          }
        });
      } catch (sqlError) {
        console.error('Error executing direct SQL:', sqlError);
        throw sqlError;
      }
      
    } catch (error) {
      console.error('Error creating branch distribution request:', error);
      console.error('SQL message:', error.parent?.sqlMessage);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create branch distribution request',
        error: error.message,
        sqlError: error.parent?.sqlMessage
      });
    }
  },

  // Update branch request status (approve, reject, etc.)
  async updateBranchRequestStatus(req, res) {
    try {
      const { requestId } = req.params;
      const { status, notes } = req.body;
      
      console.log(`Updating branch request ${requestId} status to ${status}`);
      
      // Validate the status
      if (!['pending', 'approved', 'rejected', 'fulfilled', 'canceled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      
      // Find the request
      const request = await BranchDistributionRequest.findOne({
        where: { 
          [Op.or]: [
            { id: isNaN(requestId) ? -1 : requestId },
            { request_id: requestId }
          ]
        }
      });
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Branch distribution request not found'
        });
      }
      
      // Update status and appropriate timestamp fields
      const updateData = {
        status: status,
        process_notes: notes || null,
        processed_by: req.user?.employee_id || null,
        processed_at: new Date()
      };
      
      await request.update(updateData);
      
      return res.json({
        success: true,
        message: `Request status updated to ${status}`,
        data: request
      });
    } catch (error) {
      console.error('Error updating branch request status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update request status',
        error: error.message
      });
    }
  }
};

module.exports = productionDistributionController; 