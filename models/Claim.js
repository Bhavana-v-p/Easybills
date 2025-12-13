// models/Claim.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExpenseClaim = sequelize.define('ExpenseClaim', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Reference to the faculty member
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
    // 🟢 UPDATED: Includes all required statuses for your workflow
    status: {
        type: DataTypes.ENUM(
            'draft', 
            'submitted', 
            'verified', 
            'approved',         // Legacy status
            'paid',             // Legacy status
            'clarification needed', // Legacy status
            'rejected',         // 👈 Added
            'referred_back',    // 👈 Added (maps to 'more_info')
            'pending_payment',  // 👈 Added (maps to 'approved')
            'disbursed'         // 👈 Added (maps to 'paid')
        ),
        allowNull: false,
        defaultValue: 'draft'
    },
    // Store documents and audit trail as JSONB arrays
    documents: {
        type: DataTypes.JSONB,
        defaultValue: [], 
        comment: 'Secure storage URLs for bills and receipts.'
    },
    auditTrail: {
        type: DataTypes.JSONB,
        defaultValue: [], 
        comment: 'Maintains digital audit trails for transparency.'
    },
    comments: {
        type: DataTypes.JSONB,
        defaultValue: [],
    }
}, {
    tableName: 'ExpenseClaims'
});

module.exports = ExpenseClaim;