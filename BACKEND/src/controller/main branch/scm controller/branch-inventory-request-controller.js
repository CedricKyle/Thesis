const { BranchDistributionRequest, BranchDistributionRequestItem, Employee, sequelize } = require('../../../model/Index.js')
const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')

const branchInventoryRequestController = {
  // Create a new branch distribution request
  async createRequest(req, res) {
    const transaction = await sequelize.transaction()
    
    try {
      const { branch_id, branch_name, remarks, items } = req.body
      
      if (!branch_id || !branch_name || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID, branch name, and at least one item are required'
        })
      }
      
      // Generate a unique request ID
      const request_id = `BR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      // Create the request
      const request = await BranchDistributionRequest.create({
        request_id,
        branch_id,
        branch_name,
        remarks,
        status: 'pending',
        requested_by: req.user?.employee_id || null, // Add user info if available
        requested_at: new Date()
      }, { transaction })
      
      // Create request items
      const requestItems = []
      for (const item of items) {
        const requestItem = await BranchDistributionRequestItem.create({
          request_id,
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category || 'Others',
          fulfilled_quantity: 0 // Initially zero
        }, { transaction })
        
        requestItems.push(requestItem)
      }
      
      await transaction.commit()
      
      return res.status(201).json({
        success: true,
        message: 'Branch distribution request created successfully',
        data: {
          request,
          items: requestItems
        }
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error creating branch distribution request:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to create branch distribution request',
        error: error.message
      })
    }
  },
  
  // Get all requests for a specific branch (or all branches if branch_id is 'all')
  async getBranchRequests(req, res) {
    try {
      const { branch_id } = req.params
      console.log('Fetching branch requests for branch_id:', branch_id);
      
      let whereClause = {}
      if (branch_id !== 'all') {
        whereClause.branch_id = branch_id
      }
      
      // Try to get requests without relationships first
      try {
        const requests = await BranchDistributionRequest.findAll({
          where: whereClause,
          order: [['requested_at', 'DESC']]
        });
        
        console.log(`Found ${requests.length} branch requests without relationships`);
        
        // Now try to include items for each request
        for (let request of requests) {
          try {
            const items = await BranchDistributionRequestItem.findAll({
              where: { request_id: request.request_id }
            });
            request.setDataValue('items', items);
          } catch (itemError) {
            console.error('Error fetching items for request:', request.request_id, itemError);
            request.setDataValue('items', []);
          }
        }
        
        return res.json({
          success: true,
          data: requests
        });
      } catch (error) {
        console.error('Error with relationship query, trying simplified query:', error);
        // Fallback to direct SQL if ORM relationships fail
        const [results] = await sequelize.query(
          'SELECT * FROM branch_distribution_requests WHERE ' + 
          (branch_id !== 'all' ? 'branch_id = :branch_id' : '1=1') + 
          ' ORDER BY requested_at DESC',
          { 
            replacements: { branch_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        return res.json({
          success: true,
          data: results
        });
      }
    } catch (error) {
      console.error('Error fetching branch requests:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch branch requests',
        error: error.message
      });
    }
  },
  
  // Get a specific request by ID
  async getRequestById(req, res) {
    try {
      const { request_id } = req.params
      console.log('Fetching details for request ID:', request_id);
      
      try {
        // Try with relationships first
        const request = await BranchDistributionRequest.findOne({
          where: { 
            [Op.or]: [
              { id: isNaN(request_id) ? -1 : request_id },
              { request_id }
            ]
          }
        });
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Branch distribution request not found'
          });
        }
        
        // Get request items separately
        const items = await BranchDistributionRequestItem.findAll({
          where: { request_id: request.request_id }
        });
        
        // Add items to the request object
        request.setDataValue('items', items);
        
        return res.json({
          success: true,
          data: request
        });
      } catch (error) {
        console.error('Error with ORM query, trying direct SQL query:', error);
        
        // Fallback to direct SQL query
        const [requestResults] = await sequelize.query(
          'SELECT * FROM branch_distribution_requests WHERE id = :id OR request_id = :request_id LIMIT 1',
          {
            replacements: { 
              id: isNaN(request_id) ? -1 : request_id,
              request_id 
            },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        if (!requestResults || requestResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Branch distribution request not found'
          });
        }
        
        // Get items with direct SQL
        const [itemResults] = await sequelize.query(
          'SELECT * FROM branch_distribution_request_items WHERE request_id = :request_id',
          {
            replacements: { 
              request_id: requestResults[0]?.request_id || request_id
            },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        // Combine the results
        const result = requestResults[0] || {};
        result.items = itemResults || [];
        
        return res.json({
          success: true,
          data: result
        });
      }
    } catch (error) {
      console.error('Error fetching branch request details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch branch request details',
        error: error.message
      });
    }
  }
}

module.exports = branchInventoryRequestController 