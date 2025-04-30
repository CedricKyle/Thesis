const express = require('express')
const router = express.Router()
const inventoryController = require('../../../controller/main branch/scm controller/inventory-controller.js')
const multer = require('multer')
const path = require('path')

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/inventory_images/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
})
const upload = multer({ storage })

router.get('/', inventoryController.getAll)
router.get('/:id', inventoryController.getOne)
router.post('/', upload.single('image'), inventoryController.create)
router.put('/:id', upload.single('image'), inventoryController.update)
router.delete('/:id', inventoryController.delete)
router.patch('/restore/:id', inventoryController.restore)
router.get('/price-history/:id', inventoryController.getPriceHistory)

module.exports = router
