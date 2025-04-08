import { ref } from 'vue'

export function useToast(duration = 3000) {
  const toast = ref({
    show: false,
    type: 'success',
    message: '',
  })

  const showToast = (type, message) => {
    toast.value = {
      show: true,
      type,
      message,
    }

    // Auto hide after duration
    setTimeout(() => {
      toast.value.show = false
    }, duration)
  }

  const hideToast = () => {
    toast.value.show = false
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
