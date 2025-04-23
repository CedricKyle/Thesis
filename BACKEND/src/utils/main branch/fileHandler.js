import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

// Configure multer storage
const storage = multer.memoryStorage() // Use memory storage for flexibility

// File filters
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profileImage') {
    // Handle profile image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for profile picture'), false)
    }
  } else if (file.fieldname === 'resume') {
    // Handle resume
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed for resume'), false)
    }
  } else {
    cb(new Error('Unexpected field'), false)
  }
}

// Create multer upload instance for multiple files
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
])

// Helper function to save file
export const saveFile = async (file, type) => {
  if (!file) return null

  const directory = type === 'profile' ? 'profiles' : 'resumes'
  const prefix = type === 'profile' ? 'profile-' : 'resume-'

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const filename = prefix + uniqueSuffix + path.extname(file.originalname)
  const filepath = path.join(__dirname, `../../../uploads/main branch/${directory}`, filename)

  await fs.writeFile(filepath, file.buffer)
  return `uploads/main branch/${directory}/${filename}`
}

// Helper function to delete file
export const deleteFile = async (filePath) => {
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
