const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const {
  createStockAdjustment,
  getStockAdjustments,
  softDeleteStockAdjustment,
  restoreStockAdjustment,
} = require('../../../controller/main branch/scm controller/stock-adjustment-controller')

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/adjustment_docs/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})
const upload = multer({ storage })

router.post('/', upload.single('document'), createStockAdjustment)
router.get('/', getStockAdjustments)
router.delete('/:id', softDeleteStockAdjustment)
router.patch('/restore/:id', restoreStockAdjustment)

module.exports = router
