const { Sequelize } = require('sequelize')
const config = require('../config/sequelize.config.js')[process.env.NODE_ENV || 'development']

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false, // Set to console.log to see SQL queries
})

// Import models
const Employee = require('./Employee')(sequelize)
const EmergencyContact = require('./EmergencyContact')(sequelize)
const Role = require('./Role')(sequelize)
const User = require('./User')(sequelize)
const EmployeeAttendance = require('./EmployeeAttendance')(sequelize)
const InventoryProduct = require('./SCM Model/InventoryProduct')(sequelize)
const ProductPriceHistory = require('./SCM Model/ProductPriceHistory.js')(sequelize)
const StockIn = require('./SCM Model/StockIn.js')(sequelize)
const StockOut = require('./SCM Model/StockOut.js')(sequelize)
const StockAdjustment = require('./SCM Model/StockAdjustment')(sequelize)
const Position = require('./EmployeePositions')(sequelize)

// Define relationships
Employee.hasOne(EmergencyContact, {
  foreignKey: 'employee_id',
  as: 'emergencyContact',
})
EmergencyContact.belongsTo(Employee, {
  foreignKey: 'employee_id',
})

Employee.hasOne(User, {
  foreignKey: 'employee_id',
  as: 'user',
})
User.belongsTo(Employee, {
  foreignKey: 'employee_id',
})

Employee.belongsTo(Role, {
  foreignKey: 'role_id',
  targetKey: 'id',
  as: 'roleInfo',
})
Role.hasMany(Employee, {
  foreignKey: 'role_id',
  sourceKey: 'id',
})

// Add Attendance relationships
Employee.hasMany(EmployeeAttendance, {
  foreignKey: 'employee_id',
  sourceKey: 'employee_id',
  as: 'attendanceRecords',
})

EmployeeAttendance.belongsTo(Employee, {
  foreignKey: 'employee_id',
  targetKey: 'employee_id',
  as: 'employee',
})

// For the approver relationship
EmployeeAttendance.belongsTo(Employee, {
  foreignKey: 'approved_by',
  targetKey: 'employee_id',
  as: 'approver',
})

// Associations
StockAdjustment.belongsTo(InventoryProduct, { foreignKey: 'product_id' })
InventoryProduct.hasMany(StockAdjustment, { foreignKey: 'product_id' })

// Export models and sequelize instance
module.exports = {
  sequelize,
  Employee,
  EmergencyContact,
  Role,
  User,
  EmployeeAttendance,
  InventoryProduct,
  ProductPriceHistory,
  StockIn,
  StockOut,
  StockAdjustment,
  Position,
}
