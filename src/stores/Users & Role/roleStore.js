import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref([])

  const addRole = (role) => {
    roles.value.push({
      'role name': role['role name'] || role.roleName,
      description: role.description,
      permissions: role.permissions,
      'last modified': new Date().toLocaleString(),
    })
  }

  const updateRole = (oldRoleName, updatedRole) => {
    const index = roles.value.findIndex((role) => role['role name'] === oldRoleName)
    if (index !== -1) {
      roles.value[index] = {
        'role name': updatedRole['role name'] || updatedRole.roleName,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        'last modified': new Date().toLocaleString(),
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
