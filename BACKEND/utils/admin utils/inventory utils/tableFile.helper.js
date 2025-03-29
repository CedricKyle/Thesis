const fs = require('fs').promises
const path = require('path')

const getFilePath = (category) => {
  const fileName = {
    'Food Products': 'foods.json',
    'Dry Goods': 'drygoods.json',
    'Wet Goods': 'wetgoods.json',
  }[category]

  return path.join(__dirname, '../data', fileName)
}

const readJsonFile = async (filePath) => {
  const data = await fs.readFile(filePath, 'utf8')
  return JSON.parse(data)
}

const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

module.exports = {
  getFilePath,
  readJsonFile,
  writeJsonFile,
}
