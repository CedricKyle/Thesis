export const validateName = (value) => {
  if (!value.trim()) {
    return {
      isValid: false,
      error: 'Product name is required',
    }
  }
  return { isValid: true, error: '' }
}

export const validatePrice = (value) => {
  const price = Number(value)
  if (isNaN(price)) {
    return {
      isValid: false,
      error: 'Price must be a number',
    }
  }
  if (price < 0) {
    return {
      isValid: false,
      error: 'Price cannot be less than 0',
    }
  }
  return { isValid: true, error: '' }
}

export const validateQuantity = (value, maxQty) => {
  const qty = Number(value)
  if (isNaN(qty)) {
    return {
      isValid: false,
      error: 'Quantity must be a number',
    }
  }
  if (qty < 0) {
    return {
      isValid: false,
      error: 'Quantity cannot be less than 0',
    }
  }
  if (maxQty && qty > Number(maxQty)) {
    return {
      isValid: false,
      error: 'Quantity cannot exceed Max Quantity',
    }
  }
  return { isValid: true, error: '' }
}

export const validateMaxQuantity = (value) => {
  const maxQty = Number(value)
  if (isNaN(maxQty)) {
    return {
      isValid: false,
      error: 'Max Quantity must be a number',
    }
  }
  if (maxQty < 0) {
    return {
      isValid: false,
      error: 'Max Quantity cannot be less than 0',
    }
  }
  return { isValid: true, error: '' }
}

export const validateDate = (value) => {
  if (!value) {
    return {
      isValid: false,
      error: 'Expiry date is required',
    }
  }
  return { isValid: true, error: '' }
}
