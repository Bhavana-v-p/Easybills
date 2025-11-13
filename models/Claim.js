// models/Claim.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExpenseClaim = sequelize.define('ExpenseClaim', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Reference to the faculty member (Foreign Key would be set up with a User model)
    facultyId: { 
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Travel', 'Stationery', 'Registration Fees', 'Academic Events', 'Other'),
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    dateIncurred: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Tracking and Approval Status
    status: {
        type: DataTypes.ENUM('submitted', 'verified', 'approved', 'paid', 'clarification needed'),
        allowNull: false,
        defaultValue: 'submitted'
    },
    // Store documents and audit trail as JSONB arrays (PostgreSQL data type)
    documents: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of objects: [{ fileName, fileUrl }]
        comment: 'Secure storage URLs for bills and receipts.'
    },
    auditTrail: {
        type: DataTypes.JSONB,
        defaultValue: [], // Array of objects: [{ timestamp, status, changedBy, notes }]
        comment: 'Maintains digital audit trails for transparency.'
    },
    comments: {
        type: DataTypes.JSONB,
        defaultValue: [], // Accounts dashboard can add comments/feedback.
    }
}, {
    // Sequelize adds createdAt and updatedAt columns by default
    tableName: 'ExpenseClaims'
});

module.exports = ExpenseClaim;
