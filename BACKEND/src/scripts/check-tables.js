// This script checks if required tables exist and creates them if they don't
const { Sequelize } = require('sequelize');
const config = require('../config/sequelize.config.js')['development'];
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: console.log
});

async function checkAndCreateTables() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get list of existing tables
    const [existingTables] = await sequelize.query('SHOW TABLES');
    console.log('Existing tables:', existingTables);

    // Check if our required tables exist
    const tableNames = existingTables.map(row => Object.values(row)[0]);
    
    if (!tableNames.includes('branch_distribution_requests')) {
      console.log('branch_distribution_requests table does not exist, creating...');
      
      // Create branch_distribution_requests table - remove created_at and updated_at
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS branch_distribution_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(50) NOT NULL UNIQUE,
          branch_id INT NOT NULL,
          branch_name VARCHAR(100) NOT NULL,
          remarks TEXT,
          status ENUM('pending', 'approved', 'rejected', 'fulfilled', 'canceled') NOT NULL DEFAULT 'pending',
          requested_by VARCHAR(50),
          requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          processed_by VARCHAR(50),
          processed_at DATETIME,
          process_notes TEXT,
          fulfilled_by VARCHAR(50),
          fulfilled_at DATETIME,
          deleted_at DATETIME
        )
      `);
      console.log('branch_distribution_requests table created');
    } else {
      console.log('branch_distribution_requests table already exists');
    }
    
    if (!tableNames.includes('branch_distribution_request_items')) {
      console.log('branch_distribution_request_items table does not exist, creating...');
      
      // Create branch_distribution_request_items table - remove created_at and updated_at
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS branch_distribution_request_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(50) NOT NULL,
          product_id INT NOT NULL,
          product_code VARCHAR(50),
          product_name VARCHAR(100) NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          unit VARCHAR(20) NOT NULL,
          category VARCHAR(50),
          notes TEXT,
          fulfilled_quantity INT DEFAULT 0,
          FOREIGN KEY (request_id) REFERENCES branch_distribution_requests(request_id)
        )
      `);
      console.log('branch_distribution_request_items table created');
    } else {
      console.log('branch_distribution_request_items table already exists');
    }

    // Fix existing branch_distribution_requests table if it exists but has incorrect schema
    if (tableNames.includes('branch_distribution_requests')) {
      console.log('Checking branch_distribution_requests table schema...');
      
      // Check current columns
      const [currentColumns] = await sequelize.query('DESCRIBE branch_distribution_requests');
      const columnNames = currentColumns.map(col => col.Field);
      console.log('Current columns:', columnNames);
      
      // Check and add missing columns if needed
      const requiredColumns = [
        { name: 'requested_at', definition: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' },
        { name: 'processed_by', definition: 'VARCHAR(50)' },
        { name: 'processed_at', definition: 'DATETIME' },
        { name: 'process_notes', definition: 'TEXT' },
        { name: 'fulfilled_by', definition: 'VARCHAR(50)' },
        { name: 'fulfilled_at', definition: 'DATETIME' },
        { name: 'deleted_at', definition: 'DATETIME' }
      ];
      
      for (const column of requiredColumns) {
        if (!columnNames.includes(column.name)) {
          console.log(`Adding missing column ${column.name} to branch_distribution_requests`);
          await sequelize.query(`ALTER TABLE branch_distribution_requests ADD COLUMN ${column.name} ${column.definition}`);
        }
      }
    }

    console.log('Table check and creation complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAndCreateTables(); 