import { ref } from 'vue'
import * as pdfjs from 'pdfjs-dist'

// Initialize PDF.js worker once
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export function useResumeUpload(showToastMessage) {
  const resumeFile = ref(null)
  const resumeFileName = ref('')
  const isProcessing = ref(false)

  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      return (
        await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1)
            const textContent = await page.getTextContent()
            return textContent.items.map((item) => item.str).join(' ')
          }),
        )
      )
        .join(' ')
        .toLowerCase()
    } catch (error) {
      throw new Error('Error reading PDF content')
    }
  }

  const validateResumeContent = async (content) => {
    const requiredSections = {
      education: ['education', 'university', 'college', 'degree'],
      experience: ['experience', 'work history', 'employment'],
      skills: ['skills', 'expertise', 'competencies'],
    }

    return Object.values(requiredSections).every((keywords) =>
      keywords.some((keyword) => content.includes(keyword)),
    )
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return null

    isProcessing.value = true
    showToastMessage('Processing resume...', 'info')

    try {
      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF document')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size should not exceed 5MB')
      }

      const content = await extractTextFromPDF(file)
      const isValid = await validateResumeContent(content)

      if (!isValid) {
        throw new Error(
          'Please upload a complete resume with education, experience, and skills sections',
        )
      }

      resumeFile.value = file
      resumeFileName.value = file.name
      showToastMessage('Resume validated successfully', 'success')

      return file
    } catch (error) {
      showToastMessage(error.message, 'error')
      event.target.value = ''
      removeResume()
      return null
    } finally {
      isProcessing.value = false
    }
  }

  const removeResume = () => {
    resumeFile.value = null
    resumeFileName.value = ''
    return null
  }

  return {
    resumeFile,
    resumeFileName,
    isProcessing,
    handleResumeUpload,
    removeResume,
  }
}
