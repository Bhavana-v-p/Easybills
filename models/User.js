// models/User.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: { type: DataTypes.STRING, allowNull: true }, // Ensure this exists for your name update feature
  role: { type: DataTypes.ENUM('Faculty', 'Accounts'), defaultValue: 'Faculty' },
  picture: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'Users'
});

module.exports = User;
