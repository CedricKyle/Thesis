import { ref, computed } from 'vue'

export default function useProductManagement() {
  const foodProducts = ref([])
  const dryGoods = ref([])
  const wetGoods = ref([])

  const foodProductsId = ref(1)
  const dryGoodsId = ref(1)
  const wetGoodsId = ref(1)

  const addProduct = (product, category) => {
    validateCategory(category)
    let productId
    switch (category) {
      case 'Food Products':
        productId = foodProductsId.value++
        foodProducts.value.push({ ...product, id: productId, category })
        break
      case 'Dry Goods':
        productId = dryGoodsId.value++
        dryGoods.value.push({ ...product, id: productId, category })
        break
      case 'Wet Goods':
        productId = wetGoodsId.value++
        wetGoods.value.push({ ...product, id: productId, category })
        break
    }
    return productId
  }

  const updateProduct = (product, category) => {
    switch (category) {
      case 'Food Products':
        const foodIndex = foodProducts.value.findIndex((p) => p.id === product.id)
        if (foodIndex !== -1) foodProducts.value[foodIndex] = { ...product }
        break
      case 'Dry Goods':
        const dryIndex = dryGoods.value.findIndex((p) => p.id === product.id)
        if (dryIndex !== -1) dryGoods.value[dryIndex] = { ...product }
        break
      case 'Wet Goods':
        const wetIndex = wetGoods.value.findIndex((p) => p.id === product.id)
        if (wetIndex !== -1) wetGoods.value[wetIndex] = { ...product }
        break
    }
  }

  const deleteProduct = (product, category) => {
    switch (category) {
      case 'Food Products':
        foodProducts.value = foodProducts.value.filter((p) => p.id !== product.id)
        break
      case 'Dry Goods':
        dryGoods.value = dryGoods.value.filter((p) => p.id !== product.id)
        break
      case 'Wet Goods':
        wetGoods.value = wetGoods.value.filter((p) => p.id !== product.id)
        break
    }
  }

  const getProductsByCategory = (category) => {
    switch (category) {
      case 'Food Products':
        return foodProducts.value
      case 'Dry Goods':
        return dryGoods.value
      case 'Wet Goods':
        return wetGoods.value
      default:
        return []
    }
  }

  const validateCategory = (category) => {
    const validCategories = ['Food Products', 'Dry Goods', 'Wet Goods']
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`)
    }
  }

  return {
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
  }
}
