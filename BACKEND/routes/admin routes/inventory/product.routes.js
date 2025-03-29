const express = require('express')
const router = express.Router()
const productController = require('../../../cotrollers/Admin Controller/Inventory/product.controllers')

router.get('/:category', productController.getProducts)
router.post('/:category', productController.addProduct)
router.put('/:category/:id', productController.updateProduct)
router.delete('/:category/:id', productController.deleteProduct)

module.exports = router
