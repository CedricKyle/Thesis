import { ref } from 'vue'

export function useEmployeeValidation() {
  const formErrors = ref({
    professional: {
      dateOfHire: '',
      department: '',
      jobTitle: '',
    },
    personal: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      contactNumber: '',
      email: '',
      address: '',
    },
    emergencyContact: {
      fullName: '',
      contactNumber: '',
    },
  })

  const validateProfessionalInfo = (employee) => {
    let isValid = true
    const errors = formErrors.value.professional

    if (!employee.dateOfHire) {
      errors.dateOfHire = 'Date of hire is required'
      isValid = false
    } else {
      errors.dateOfHire = ''
    }

    if (!employee.department) {
      errors.department = 'Department is required'
      isValid = false
    } else {
      errors.department = ''
    }

    if (!employee.jobTitle) {
      errors.jobTitle = 'Job title is required'
      isValid = false
    } else {
      errors.jobTitle = ''
    }

    return isValid
  }

  const validatePersonalInfo = (employee) => {
    let isValid = true
    const errors = formErrors.value.personal

    if (!employee.fullName) {
      errors.fullName = 'Full name is required'
      isValid = false
    } else if (employee.fullName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters'
      isValid = false
    } else {
      errors.fullName = ''
    }

    if (!employee.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
      isValid = false
    } else {
      const birthDate = new Date(employee.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        errors.dateOfBirth = 'Employee must be at least 18 years old'
        isValid = false
      } else {
        errors.dateOfBirth = ''
      }
    }

    if (!employee.gender) {
      errors.gender = 'Gender is required'
      isValid = false
    } else {
      errors.gender = ''
    }

    if (!employee.maritalStatus) {
      errors.maritalStatus = 'Marital status is required'
      isValid = false
    } else {
      errors.maritalStatus = ''
    }

    const phoneRegex = /^09\d{9}$/
    if (!employee.contactNumber) {
      errors.contactNumber = 'Contact number is required'
      isValid = false
    } else if (!phoneRegex.test(employee.contactNumber)) {
      errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
      isValid = false
    } else {
      errors.contactNumber = ''
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!employee.email) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!emailRegex.test(employee.email)) {
      errors.email = 'Invalid email format'
      isValid = false
    } else {
      errors.email = ''
    }

    if (!employee.address) {
      errors.address = 'Address is required'
      isValid = false
    } else {
      errors.address = ''
    }

    return isValid
  }

  const validateEmergencyContact = (employee) => {
    let isValid = true
    const errors = formErrors.value.emergencyContact

    if (!employee.emergencyContact.fullName) {
      errors.fullName = 'Emergency contact name is required'
      isValid = false
    } else {
      errors.fullName = ''
    }

    const phoneRegex = /^09\d{9}$/
    if (!employee.emergencyContact.contactNumber) {
      errors.contactNumber = 'Emergency contact number is required'
      isValid = false
    } else if (!phoneRegex.test(employee.emergencyContact.contactNumber)) {
      errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
      isValid = false
    } else {
      errors.contactNumber = ''
    }

    return isValid
  }

  const resetErrors = () => {
    formErrors.value = {
      professional: {
        dateOfHire: '',
        department: '',
        jobTitle: '',
      },
      personal: {
        fullName: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        contactNumber: '',
        email: '',
        address: '',
      },
      emergencyContact: {
        fullName: '',
        contactNumber: '',
      },
    }
  }

  const VALIDATION_RULES = {
    PHONE_REGEX: /^09\d{9}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_NAME_LENGTH: 2,
    MIN_AGE: 18,
  }

  return {
    formErrors,
    validateProfessionalInfo,
    validatePersonalInfo,
    validateEmergencyContact,
    resetErrors,
    VALIDATION_RULES,
  }
}
