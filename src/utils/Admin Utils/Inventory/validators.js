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

export const validateQuantity = (quantity, maxQty) => {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { error: 'Quantity is required' }
  }

  const qty = Number(quantity)
  if (isNaN(qty) || qty < 0) {
    return { error: 'Quantity must be a positive number' }
  }

  if (maxQty && Number(maxQty) > 0 && qty > Number(maxQty)) {
    return { error: 'Quantity cannot exceed max quantity' }
  }

  return { error: null }
}

export const validateMaxQuantity = (maxQty) => {
  if (maxQty === null || maxQty === undefined || maxQty === '') {
    return { error: 'Max quantity is required' }
  }

  const max = Number(maxQty)
  if (isNaN(max) || max <= 0) {
    return { error: 'Max quantity must be greater than 0' }
  }

  return { error: null }
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
