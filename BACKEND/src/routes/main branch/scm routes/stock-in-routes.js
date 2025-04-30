const express = require('express')
const router = express.Router()
const stockInController = require('../../../controller/main branch/scm controller/stock-in-controller.js')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/stock_in_docs/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
})
const upload = multer({ storage })

router.get('/', stockInController.getAll)
router.post('/', upload.single('document'), stockInController.create)

module.exports = router
