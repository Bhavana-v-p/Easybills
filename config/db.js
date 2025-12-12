const { Sequelize } = require('sequelize');
require('dotenv').config();

// Setup Sequelize with SSL for Render (Production)
const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    dialect: 'postgres',
    port: process.env.PG_PORT || 5432,
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false // Required for Render's self-signed certs
      } : false
    }
  }
);

// =========================================================
// 👇 1. IMPORT MODELS TO DEFINE ASSOCIATIONS
// =========================================================
const User = require('../models/User');
const ExpenseClaim = require('../models/Claim');

// =========================================================
// 👇 2. DEFINE RELATIONSHIPS
// This fixes the "EagerLoadingError" by telling Sequelize how tables connect
// =========================================================

// A User can have multiple Claims
User.hasMany(ExpenseClaim, { 
    foreignKey: 'facultyId' 
});

// A Claim belongs to one User
ExpenseClaim.belongsTo(User, { 
    foreignKey: 'facultyId',
    targetKey: 'id'
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected...');
    
    // 👇 Sync models with database
    // It creates the tables (Users, ExpenseClaims) if they don't exist
    await sequelize.sync({ alter: true }); 
    console.log('✅ Database Synced (Tables Created)');

  } catch (err) {
    console.error('❌ Unable to connect to the database:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };