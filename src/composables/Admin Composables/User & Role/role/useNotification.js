import { ref } from 'vue'

export function useNotification() {
  const notification = ref({
    show: false,
    type: 'success',
    title: '',
    message: '',
  })

  const showNotification = (type, message, title = type === 'success' ? 'Success' : 'Error') => {
    notification.value = {
      show: true,
      type,
      title,
      message,
    }
  }

  const closeNotification = () => {
    notification.value.show = false
  }

  return {
    notification,
    showNotification,
    closeNotification,
  }
}
