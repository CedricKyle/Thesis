import { ref } from 'vue'

export function useToast() {
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref('success')

  const showToastMessage = (message, type = 'success') => {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
    setTimeout(() => (showToast.value = false), 3000)
  }

  return {
    showToast,
    toastMessage,
    toastType,
    showToastMessage,
  }
}
