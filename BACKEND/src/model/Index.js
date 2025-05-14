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
const EmployeeDeduction = require('./EmployeeDeduction')(sequelize)
const AvailableSchedule = require('./AvailableSchedule')(sequelize)
const EmployeeSchedule = require('./EmployeeSchedule')(sequelize)
const Leave = require('./LeavesModel')(sequelize)
const Payroll = require('./PayrollModel')(sequelize)
const AuditLog = require('./AuditLog.js')(sequelize, Sequelize.DataTypes)
const PayrollDeduction = require('./PayrollDeduction')(sequelize, Sequelize.DataTypes)
const SCMRequest = require('./SCM Model/SCMRequest')(sequelize)
const SCMRequestItem = require('./SCM Model/SCMRequestItem')(sequelize)

// Define relationships for other models (not EmployeeAttendance!)
// (Keep only these if you need them)
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

// Add Attendance relationships
Employee.hasMany(EmployeeAttendance, {
  foreignKey: 'employee_id',
  sourceKey: 'employee_id',
  as: 'attendanceRecords',
})

// Associations
StockAdjustment.belongsTo(InventoryProduct, { foreignKey: 'product_id' })
InventoryProduct.hasMany(StockAdjustment, { foreignKey: 'product_id' })

// After defining Leave and Employee
Leave.belongsTo(Employee, { foreignKey: 'employee_id', targetKey: 'employee_id' })
Employee.hasMany(Leave, { foreignKey: 'employee_id', sourceKey: 'employee_id' })

// Add SCMRequest relationships
SCMRequest.hasMany(SCMRequestItem, {
  foreignKey: 'request_id',
  sourceKey: 'request_id',
  as: 'requestItems',
})
SCMRequestItem.belongsTo(SCMRequest, {
  foreignKey: 'request_id',
  targetKey: 'request_id',
})

// Export models and sequelize instance
const db = {
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
  EmployeeDeduction,
  AvailableSchedule,
  EmployeeSchedule,
  Leave,
  Payroll,
  AuditLog,
  PayrollDeduction,
  SCMRequest,
  SCMRequestItem,
}

// Call associate for all models
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db)
  }
})

module.exports = db
