const multer = require('multer')
const path = require('path')
const fs = require('fs').promises

// Configure multer storage
const storage = multer.memoryStorage()

// Create upload directories if they don't exist
const createUploadDirectories = async () => {
  const directories = ['profiles', 'resumes']

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '../../../uploads/main branch', dir)
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }
}

// Create upload directories on startup
createUploadDirectories()

// File filters
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profileImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for profile picture'), false)
    }
  } else if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed for resume'), false)
    }
  } else {
    cb(new Error('Unexpected field'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
])

const saveFile = async (file, type) => {
  if (!file) return null

  const directory = type === 'profile' ? 'profiles' : 'resumes'
  const prefix = type === 'profile' ? 'profile-' : 'resume-'

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const filename = prefix + uniqueSuffix + path.extname(file.originalname)
  const filepath = path.join(__dirname, `../../../uploads/main branch/${directory}`, filename)

  await fs.writeFile(filepath, file.buffer)
  return `uploads/main branch/${directory}/${filename}`
}

const deleteFile = async (filePath) => {
  if (!filePath) return true

  try {
    const fullPath = path.join(__dirname, '../../../', filePath)
    await fs.unlink(fullPath)
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

module.exports = {
  upload,
  saveFile,
  deleteFile,
}
