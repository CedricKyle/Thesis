import { ref, watch } from 'vue'

export function useRoleSearch(roles, onSearch) {
  const searchInput = ref('')
  const filteredRoles = ref([])

  const handleSearch = () => {
    if (!searchInput.value.trim()) {
      filteredRoles.value = roles.value
    } else {
      const searchTerm = searchInput.value.toLowerCase()
      filteredRoles.value = roles.value.filter((role) => {
        return (
          role.role_name.toLowerCase().includes(searchTerm) ||
          (role.description?.toLowerCase() || '').includes(searchTerm)
        )
      })
    }
    onSearch?.(filteredRoles.value)
  }

  watch(
    () => roles.value,
    () => {
      filteredRoles.value = roles.value
    },
    { deep: true },
  )

  return {
    searchInput,
    filteredRoles,
    handleSearch,
  }
}
