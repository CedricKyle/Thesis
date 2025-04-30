const express = require('express')
const router = express.Router()
const stockOutController = require('../../../controller/main branch/scm controller/stock-out-controller.js')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/stock_out_docs/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
})
const upload = multer({ storage })

router.get('/', stockOutController.getAll)
router.post('/', upload.single('document'), stockOutController.create)

module.exports = router
