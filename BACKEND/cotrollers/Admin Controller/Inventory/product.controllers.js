const {
  getFilePath,
  readJsonFile,
  writeJsonFile,
} = require('../../../utils/admin utils/inventory utils/tableFile.helper')

const productController = {
  async getProducts(req, res, next) {
    try {
      const filePath = getFilePath(req.params.category)
      const products = await readJsonFile(filePath)
      res.json(products)
    } catch (error) {
      next(error)
    }
  },

  async addProduct(req, res, next) {
    try {
      const filePath = getFilePath(req.params.category)
      const products = await readJsonFile(filePath)

      const newProduct = {
        ...req.body,
        id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      }

      products.push(newProduct)
      await writeJsonFile(filePath, products)

      res.status(201).json(newProduct)
    } catch (error) {
      next(error)
    }
  },

  async updateProduct(req, res, next) {
    try {
      const filePath = getFilePath(req.params.category)
      const products = await readJsonFile(filePath)

      const index = products.findIndex((p) => p.id === parseInt(req.params.id))
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' })
      }

      products[index] = { ...products[index], ...req.body }
      await writeJsonFile(filePath, products)

      res.json(products[index])
    } catch (error) {
      next(error)
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const filePath = getFilePath(req.params.category)
      const products = await readJsonFile(filePath)

      const filteredProducts = products.filter((p) => p.id !== parseInt(req.params.id))
      await writeJsonFile(filePath, filteredProducts)

      res.json({ message: 'Product deleted successfully' })
    } catch (error) {
      next(error)
    }
  },
}

module.exports = productController
