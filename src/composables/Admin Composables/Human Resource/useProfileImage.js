import { ref } from 'vue'

export function useProfileImage(defaultImage) {
  const profileImage = ref('')
  const showUploadText = ref(true)

  const handleProfileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      showUploadText.value = false
    }
    reader.readAsDataURL(file)
  }

  const removeProfile = () => {
    profileImage.value = ''
    showUploadText.value = true
  }

  return {
    profileImage,
    showUploadText,
    handleProfileUpload,
    removeProfile,
  }
}
