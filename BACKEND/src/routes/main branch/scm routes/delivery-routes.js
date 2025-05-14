const express = require('express')
const router = express.Router()
const deliveryController = require('../../../controller/main branch/scm controller/delivery-controller')

router.get('/', deliveryController.getAllDeliveries)
router.post('/', deliveryController.createDelivery)
router.post('/:id/receive', deliveryController.receiveDelivery)
router.post('/:id/cancel', deliveryController.cancelDelivery)
router.put('/:id', deliveryController.updateDelivery)

module.exports = router
