// services/emailService.js
const nodemailer = require('nodemailer');

// 1. Configure Transporter (Updated to Port 465 SSL)
// Switching to Port 465 is the standard fix for 'ETIMEDOUT' errors on Render
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,       // 👈 Changed to 465 (SSL)
    secure: true,    // 👈 Must be TRUE for Port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // This setting helps avoid SSL certificate errors in cloud environments
    tls: {
        rejectUnauthorized: false 
    }
});

// Helper to format ID for Email (EB00001/25)
const formatID = (id) => {
    if (!id) return 'UNKNOWN';
    const year = new Date().getFullYear().toString().slice(-2);
    return `EB${id.toString().padStart(5, '0')}/${year}`;
};

const sendEmail = async (to, subject, text) => {
    try {
        // Verify connection before attempting to send
        await transporter.verify();
        
        await transporter.sendMail({
            from: `"EasyBills Admin" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text 
        });
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// EMAIL TEMPLATES
// ==========================================

// 1. SUBMISSION CONFIRMATION
exports.sendSubmissionConfirmation = async ({ email, claimId, amount }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Submitted Successfully`;
    const text = `Dear Faculty,

Your claim #${fmtId} for ₹${amount} has been submitted and is Pending Approval.

---
EasyBills Team`;
    return sendEmail(email, subject, text);
};

// 2. APPROVED -> PENDING PAYMENT
exports.sendApprovalEmail = async ({ email, claimId, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: Approved`;
    const text = `Dear Faculty,

Expense Claim Status Update

Claim ID: ${fmtId}
New Status: Pending Payment (Approved)
Notes: ${notes || 'Your claim has been reviewed and approved.'}

---
Please log in to the EasyBills portal to view full details.`;
    return sendEmail(email, subject, text);
};

// 3. REFERRED BACK
exports.sendClarificationRequest = async ({ email, claimId, clarificationNotes }) => {
    const fmtId = formatID(claimId);
    const subject = `Clarification Needed for Claim #${fmtId}`;
    const text = `Action Required: Clarification Needed or More information

Claim ID: ${fmtId}
Status: Referred Back
Reason:
${clarificationNotes || 'Please provide itemized receipts for all expenses claimed.'}

---
Reply by logging into the EasyBills portal and updating your claim.`;
    return sendEmail(email, subject, text);
};

// 4. REJECTED
exports.sendRejectionEmail = async ({ email, claimId, rejectionReason }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: Rejected`;
    const text = `Dear Faculty,

Your claim #${fmtId} has been Rejected.

Reason:
${rejectionReason || 'Claim does not meet policy guidelines.'}

---
Please contact the Accounts department if you have questions.`;
    return sendEmail(email, subject, text);
};

// 5. PAID / DISBURSED
exports.sendPaymentEmail = async ({ email, claimId, amountPaid, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Payment Disbursed for Claim #${fmtId}`;
    const text = `Dear Faculty,

Good news! Payment for Claim #${fmtId} has been processed.

Amount Disbursed: ₹${amountPaid}
Status: Disbursed
Notes: ${notes || 'Payment transferred to your account.'}

---
Thank you,
EasyBills Finance Team`;
    return sendEmail(email, subject, text);
};

// 6. GENERIC
exports.sendStatusNotification = async ({ email, claimId, status, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: ${status}`;
    const text = `Status updated to ${status}.\nNotes: ${notes}`;
    return sendEmail(email, subject, text);
};