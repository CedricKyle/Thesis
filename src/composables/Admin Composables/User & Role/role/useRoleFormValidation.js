import { ref } from 'vue'

export const useFormValidation = () => {
  const errors = ref({})

  const validateRoleName = (roleName) => {
    if (!roleName || roleName.trim() === '') {
      errors.value.roleName = 'Role name is required'
      return false
    }
    errors.value.roleName = ''
    return true
  }

  const validateDescription = (description) => {
    if (!description || description.trim() === '') {
      errors.value.description = 'Description is required'
      return false
    }
    errors.value.description = ''
    return true
  }

  const validatePermissions = (permissions) => {
    if (!permissions || permissions.length === 0) {
      errors.value.permissions = 'At least one permission must be selected'
      return false
    }
    errors.value.permissions = ''
    return true
  }

  const validateForm = (formData) => {
    const isRoleNameValid = validateRoleName(formData.roleName)
    const isDescriptionValid = validateDescription(formData.description)
    const isPermissionsValid = validatePermissions(formData.permissions)

    return isRoleNameValid && isDescriptionValid && isPermissionsValid
  }

  const clearErrors = () => {
    errors.value = {}
  }

  return {
    errors,
    validateRoleName,
    validateDescription,
    validatePermissions,
    validateForm,
    clearErrors,
  }
}
