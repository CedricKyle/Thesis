import { ref } from 'vue'

export const useNotification = () => {
  const notification = ref({
    show: false,
    type: 'success', // Set default type
    title: '',
    message: '',
  })

  const showNotification = (notificationType, title, message) => {
    notification.value = {
      show: true,
      type: notificationType || 'success', // Provide default if not specified
      title: title || '',
      message: message || '',
    }
  }

  const closeNotification = () => {
    notification.value = {
      show: false,
      type: 'success', // Reset to default
      title: '',
      message: '',
    }
  }

  return {
    notification,
    showNotification,
    closeNotification,
  }
}
