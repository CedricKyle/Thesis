const express = require('express')
const router = express.Router()
const treasuryController = require('../../controller/main branch/treasury-controller')
const { verifyToken } = require('../../middleware/auth-middleware')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post(
  '/scm-requests/:id/release-cash',
  verifyToken,
  upload.single('receipt'),
  treasuryController.releaseCash,
)

module.exports = router
