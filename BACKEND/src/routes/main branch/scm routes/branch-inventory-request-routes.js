const express = require('express')
const controller = require('../../../controller/main branch/scm controller/branch-inventory-request-controller.js')
const router = express.Router()

// Create a new branch distribution request
router.post('/', controller.createRequest)

// Get all requests for a specific branch (or all branches if branch_id is 'all')
router.get('/requests/:branch_id', controller.getBranchRequests)

// Get a specific request by ID
router.get('/request/:request_id', controller.getRequestById)

module.exports = router 