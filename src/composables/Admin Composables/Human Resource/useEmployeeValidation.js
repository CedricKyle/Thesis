import { ref } from 'vue'

export function useEmployeeValidation() {
  const formErrors = ref({
    professional: {
      dateOfHire: '',
      department: '',
      jobTitle: '',
      role: '',
      resume: '',
    },
    personal: {
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
    },
    emergencyContact: {
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
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

    if (employee.department !== 'Admin Department') {
      if (!employee.jobTitle) {
        errors.jobTitle = 'Job title is required'
        isValid = false
      } else {
        errors.jobTitle = ''
      }
    } else {
      errors.jobTitle = ''
    }

    if (!employee.role) {
      errors.role = 'Role is required'
      isValid = false
    } else {
      errors.role = ''
    }

    if (!employee.resume) {
      errors.resume = 'Resume is required'
      isValid = false
    } else {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]

      if (!allowedTypes.includes(employee.resume.type)) {
        errors.resume = 'Please upload a PDF or Word document'
        isValid = false
      } else if (employee.resume.size > 5 * 1024 * 1024) {
        // 5MB limit
        errors.resume = 'File size should not exceed 5MB'
        isValid = false
      } else {
        errors.resume = ''
      }
    }

    formErrors.professional = errors
    return isValid
  }

  const validatePersonalInfo = (employee) => {
    let isValid = true
    const errors = formErrors.value.personal

    if (!employee.firstName) {
      errors.firstName = 'First name is required'
      isValid = false
    } else if (employee.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters'
      isValid = false
    } else {
      errors.firstName = ''
    }

    errors.middleName = ''

    if (!employee.lastName) {
      errors.lastName = 'Last name is required'
      isValid = false
    } else if (employee.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters'
      isValid = false
    } else {
      errors.lastName = ''
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

    const emailRegex = /^[^\s@]+@gmail\.com$/
    if (!employee.email) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!emailRegex.test(employee.email)) {
      errors.email = 'Only Gmail accounts are allowed (countryside@gmail.com)'
      isValid = false
    } else {
      errors.email = ''
    }

    const phoneRegex = /^09\d{9}$/
    if (!employee.contactNumber) {
      errors.contactNumber = 'Contact number is required'
      isValid = false
    } else if (!phoneRegex.test(employee.contactNumber)) {
      errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
      isValid = false
    } else if (employee.contactNumber === employee.emergencyContact?.contactNumber) {
      errors.contactNumber = 'Contact number cannot be the same as emergency contact number'
      isValid = false
    } else {
      errors.contactNumber = ''
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

    if (!employee.emergencyContact.firstName) {
      errors.firstName = 'First name is required'
      isValid = false
    } else if (employee.emergencyContact.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters'
      isValid = false
    } else {
      errors.firstName = ''
    }

    errors.middleName = ''

    if (!employee.emergencyContact.lastName) {
      errors.lastName = 'Last name is required'
      isValid = false
    } else if (employee.emergencyContact.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters'
      isValid = false
    } else {
      errors.lastName = ''
    }

    if (!employee.emergencyContact.relationship) {
      errors.relationship = 'Relationship is required'
      isValid = false
    } else {
      errors.relationship = ''
    }

    const phoneRegex = /^09\d{9}$/
    if (!employee.emergencyContact.contactNumber) {
      errors.contactNumber = 'Emergency contact number is required'
      isValid = false
    } else if (!phoneRegex.test(employee.emergencyContact.contactNumber)) {
      errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
      isValid = false
    } else if (employee.emergencyContact.contactNumber === employee.contactNumber) {
      errors.contactNumber = 'Emergency contact number cannot be the same as primary contact number'
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
        role: '',
        resume: '',
      },
      personal: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        contactNumber: '',
        email: '',
        address: '',
      },
      emergencyContact: {
        firstName: '',
        middleName: '',
        lastName: '',
        relationship: '',
        contactNumber: '',
      },
    }
  }

  const VALIDATION_RULES = {
    PHONE_REGEX: /^09\d{9}$/,
    EMAIL_REGEX: /^[^\s@]+@gmail\.com$/,
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
