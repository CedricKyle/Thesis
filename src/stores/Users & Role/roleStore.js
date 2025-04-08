import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref([])

  const addRole = (role) => {
    roles.value.push({
      ...role,
      'role name': role.roleName,
      'last modified': new Date().toISOString().split('T')[0],
    })
  }

  const updateRole = (oldRoleName, updatedRole) => {
    const index = roles.value.findIndex((role) => role['role name'] === oldRoleName)
    if (index !== -1) {
      roles.value[index] = {
        ...updatedRole,
        'role name': updatedRole.roleName,
        'last modified': new Date().toISOString().split('T')[0],
      }
    }
  }

  const deleteRole = (roleName) => {
    const index = roles.value.findIndex((role) => role['role name'] === roleName)
    if (index !== -1) {
      roles.value.splice(index, 1)
    }
  }

  return {
    roles,
    addRole,
    updateRole,
    deleteRole,
  }
})
