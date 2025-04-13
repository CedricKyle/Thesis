const multer = require('multer')
const path = require('path')
const fs = require('fs').promises

// Create upload directories if they don't exist
const createUploadDirectories = async () => {
  const directories = ['profiles', 'resumes']

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '../../uploads', dir)
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }
}

// Create upload directories on startup
createUploadDirectories()

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/main branch/profiles'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  },
})

// Configure storage for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/main branch/resumes'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname))
  },
})

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

// Create multer instances
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
})

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Helper function to delete files
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

module.exports = {
  uploadProfile,
  uploadResume,
  deleteFile,
}
