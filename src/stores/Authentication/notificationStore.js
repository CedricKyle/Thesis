import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    showNotificationModal: false,
    modalConfig: {
      title: '',
      message: '',
      type: 'info', // info, warning, error
      onClose: null,
    },
  }),

  actions: {
    showModal(config) {
      this.modalConfig = config
      this.showNotificationModal = true
    },

    hideModal() {
      this.showNotificationModal = false
      if (this.modalConfig.onClose) {
        this.modalConfig.onClose()
      }
    },
  },
})
