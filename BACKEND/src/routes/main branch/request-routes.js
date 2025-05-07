const express = require('express')
const requestController = require('../../controller/main branch/request-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

router.post('/', verifyToken, requestController.createRequest)
router.get('/', verifyToken, requestController.getAllRequests)
router.get('/:id', verifyToken, requestController.getRequestById)
router.put('/:id', verifyToken, requestController.updateRequest)
router.delete('/:id', verifyToken, requestController.deleteRequest)
router.patch('/restore/:id', verifyToken, requestController.restoreRequest)
router.post('/requests/batch-update-status', requestController.batchUpdateStatus)

module.exports = router
