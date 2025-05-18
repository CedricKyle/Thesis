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
const Delivery = require('./SCM Model/Delivery')(sequelize)
const InventoryReceiving = require('./SCM Model/InventoryReceiving')(sequelize)
const InventoryReceivingItem = require('./SCM Model/InventoryReceivingItem')(sequelize)
const Inventory = require('./SCM Model/Inventory')(sequelize)
const InventoryStockIn = require('./SCM Model/SCMStockIn')(sequelize)
const InventoryStockOut = require('./SCM Model/SCMStockOut')(sequelize)
const ProductionBatch = require('./Production Model/ProductionBatch')(sequelize)
const BatchRawMaterial = require('./Production Model/BatchRawMaterial')(sequelize)
const ProductionFinishedGood = require('./Production Model/ProductionFinishedGood')(sequelize)
const Supplier = require('./SCM Model/Suppliers')(sequelize)
const BranchDistributionRequest = require('./BranchDistributionRequest')(sequelize)
const BranchDistributionRequestItem = require('./BranchDistributionRequestItem')(sequelize)
const BranchInventory = require('./SCM Model/BranchInventory')(sequelize)

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

// Association: SCMRequest.prepared_by -> Employee.employee_id
SCMRequest.belongsTo(Employee, {
  foreignKey: 'prepared_by',
  as: 'preparedBy',
  targetKey: 'employee_id',
})

// Association: SCMRequest.approved_by -> Employee.employee_id (optional)
SCMRequest.belongsTo(Employee, {
  foreignKey: 'approved_by',
  as: 'approvedBy',
  targetKey: 'employee_id',
})

// Add this association:
SCMRequest.belongsTo(Employee, {
  as: 'releasedBy',
  foreignKey: 'released_by',
  targetKey: 'employee_id',
})

// Add Delivery relationships
SCMRequest.hasMany(Delivery, { foreignKey: 'request_id', sourceKey: 'request_id' })
Delivery.belongsTo(SCMRequest, { foreignKey: 'request_id', targetKey: 'request_id' })

// InventoryReceiving belongsTo SCMRequest
InventoryReceiving.belongsTo(SCMRequest, {
  foreignKey: 'request_id',
  targetKey: 'request_id',
  as: 'request',
})

// SCMRequest hasMany InventoryReceiving
SCMRequest.hasMany(InventoryReceiving, {
  foreignKey: 'request_id',
  sourceKey: 'request_id',
  as: 'receivings',
})

// InventoryReceiving hasMany InventoryReceivingItem
InventoryReceiving.hasMany(InventoryReceivingItem, {
  foreignKey: 'receiving_id',
  sourceKey: 'receiving_id',
  as: 'items',
})

// InventoryReceivingItem belongsTo InventoryReceiving
InventoryReceivingItem.belongsTo(InventoryReceiving, {
  foreignKey: 'receiving_id',
  targetKey: 'receiving_id',
  as: 'receiving',
})

// InventoryReceivingItem belongsTo Inventory
InventoryReceivingItem.belongsTo(Inventory, {
  foreignKey: 'item_code',
  targetKey: 'item_code',
  as: 'inventoryItem',
})

// Inventory hasMany InventoryReceivingItem
Inventory.hasMany(InventoryReceivingItem, {
  foreignKey: 'item_code',
  sourceKey: 'item_code',
  as: 'receivingItems',
})

// Add relationships
ProductionBatch.hasMany(BatchRawMaterial, {
  foreignKey: 'batch_id',
  as: 'raw_materials',
})
BatchRawMaterial.belongsTo(ProductionBatch, {
  foreignKey: 'batch_id',
})

// BatchRawMaterial belongsTo Inventory (for item details)
BatchRawMaterial.belongsTo(Inventory, {
  foreignKey: 'inventory_item_code',
  targetKey: 'item_code',
  as: 'inventory_item',
})
Inventory.hasMany(BatchRawMaterial, {
  foreignKey: 'inventory_item_code',
  sourceKey: 'item_code',
  as: 'batch_usage',
})

ProductionBatch.hasMany(ProductionFinishedGood, {
  foreignKey: 'batch_id',
  as: 'finished_goods',
})
ProductionFinishedGood.belongsTo(ProductionBatch, {
  foreignKey: 'batch_id',
  as: 'batch',
})

// Add Branch Distribution Request relationships
BranchDistributionRequest.hasMany(BranchDistributionRequestItem, {
  foreignKey: 'request_id',
  sourceKey: 'request_id',
  as: 'items',
})

BranchDistributionRequestItem.belongsTo(BranchDistributionRequest, {
  foreignKey: 'request_id',
  targetKey: 'request_id',
  as: 'request',
})

// Employee relationships for BranchDistributionRequest
BranchDistributionRequest.belongsTo(Employee, {
  foreignKey: 'requested_by',
  targetKey: 'employee_id',
  as: 'requestedByEmployee',
})

BranchDistributionRequest.belongsTo(Employee, {
  foreignKey: 'processed_by',
  targetKey: 'employee_id',
  as: 'processedByEmployee',
})

BranchDistributionRequest.belongsTo(Employee, {
  foreignKey: 'fulfilled_by',
  targetKey: 'employee_id',
  as: 'fulfilledByEmployee',
})

// BranchInventory relationships
BranchInventory.belongsTo(BranchDistributionRequest, {
  foreignKey: 'last_distribution_id',
  targetKey: 'request_id',
  as: 'lastDistribution',
})

BranchDistributionRequest.hasMany(BranchInventory, {
  foreignKey: 'last_distribution_id',
  sourceKey: 'request_id',
  as: 'branchInventory',
})

// BranchInventory to Inventory relationship for item details
BranchInventory.belongsTo(Inventory, {
  foreignKey: 'item_code',
  targetKey: 'item_code',
  as: 'inventoryItem',
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
  Delivery,
  InventoryReceiving,
  InventoryReceivingItem,
  Inventory,
  InventoryStockIn,
  InventoryStockOut,
  ProductionBatch,
  BatchRawMaterial,
  ProductionFinishedGood,
  Supplier,
  BranchDistributionRequest,
  BranchDistributionRequestItem,
  BranchInventory,
}

// Call associate for all models
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db)
  }
})

module.exports = db
