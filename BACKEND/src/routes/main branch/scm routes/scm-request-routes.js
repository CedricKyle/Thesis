const express = require('express')
const scmRequestController = require('../../../controller/main branch/scm controller/request-controller.js')
const { verifyToken } = require('../../../middleware/auth-middleware.js')

const router = express.Router()

// All routes are protected with verifyToken middleware
router.post('/', verifyToken, scmRequestController.createRequest)
router.get('/', verifyToken, scmRequestController.getAllRequests)
router.get('/:id', verifyToken, scmRequestController.getRequestById)
router.put('/:id/status', verifyToken, scmRequestController.updateRequestStatus)
router.delete('/:id', verifyToken, scmRequestController.deleteRequest)
router.post('/:id/restore', verifyToken, scmRequestController.restoreRequest)
router.put('/:id', verifyToken, scmRequestController.updateRequest)
router.post('/:id/submit-to-finance', verifyToken, scmRequestController.submitToFinance)

module.exports = router
