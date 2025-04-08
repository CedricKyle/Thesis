import { defineStore } from 'pinia'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    foodProducts: [],
    dryGoods: [],
    wetGoods: [],
    foodProductsId: 1,
    dryGoodsId: 1,
    wetGoodsId: 1,
  }),

  getters: {
    getProductsByCategory: (state) => (category) => {
      switch (category) {
        case 'Food Products':
          return state.foodProducts
        case 'Dry Goods':
          return state.dryGoods
        case 'Wet Goods':
          return state.wetGoods
        default:
          return []
      }
    },
  },

  actions: {
    validateCategory(category) {
      const validCategories = ['Food Products', 'Dry Goods', 'Wet Goods']
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}`)
      }
    },

    addProduct(product, category) {
      this.validateCategory(category)
      let productId

      switch (category) {
        case 'Food Products':
          productId = this.foodProductsId++
          this.foodProducts.push({ ...product, id: productId, category })
          break
        case 'Dry Goods':
          productId = this.dryGoodsId++
          this.dryGoods.push({ ...product, id: productId, category })
          break
        case 'Wet Goods':
          productId = this.wetGoodsId++
          this.wetGoods.push({ ...product, id: productId, category })
          break
      }
      return productId
    },

    updateProduct(product, category) {
      this.validateCategory(category)

      switch (category) {
        case 'Food Products':
          const foodIndex = this.foodProducts.findIndex((p) => p.id === product.id)
          if (foodIndex !== -1) this.foodProducts[foodIndex] = { ...product }
          break
        case 'Dry Goods':
          const dryIndex = this.dryGoods.findIndex((p) => p.id === product.id)
          if (dryIndex !== -1) this.dryGoods[dryIndex] = { ...product }
          break
        case 'Wet Goods':
          const wetIndex = this.wetGoods.findIndex((p) => p.id === product.id)
          if (wetIndex !== -1) this.wetGoods[wetIndex] = { ...product }
          break
      }
    },

    deleteProduct(product, category) {
      this.validateCategory(category)

      switch (category) {
        case 'Food Products':
          this.foodProducts = this.foodProducts.filter((p) => p.id !== product.id)
          break
        case 'Dry Goods':
          this.dryGoods = this.dryGoods.filter((p) => p.id !== product.id)
          break
        case 'Wet Goods':
          this.wetGoods = this.wetGoods.filter((p) => p.id !== product.id)
          break
      }
    },
  },
})
