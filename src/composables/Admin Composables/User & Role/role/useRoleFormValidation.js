import { ref } from 'vue'

export function useFormValidation() {
  const errors = ref({})

  const validateRoleName = (value) => {
    if (!value.trim()) {
      errors.value.roleName = 'Role name is required'
      return false
    }

    const words = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    if (words.length < 1) {
      errors.value.roleName = 'Role name must contain at least 1 word'
      return false
    }
    errors.value.roleName = ''
    return true
  }

  const validateDescription = (value) => {
    if (value.length < 10) {
      errors.value.description = 'Description must be at least 10 characters'
      return false
    }
    if (value.length > 50) {
      errors.value.description = 'Description must not exceed 50 characters'
      return false
    }
    errors.value.description = ''
    return true
  }

  const validatePermissions = (permissions) => {
    if (permissions.length < 1) {
      errors.value.permissions = 'Please select at least 1 permission'
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
