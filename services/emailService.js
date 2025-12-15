const nodemailer = require('nodemailer');

// 1. Configure Transporter (Port 465 SSL)
// This configuration bypasses standard cloud firewall blocks on Port 587.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,       // 👈 Force SSL Port
    secure: true,    // 👈 Must be TRUE for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Helper to format ID for Email (e.g., EB00001/25)
const formatID = (id) => {
    if (!id) return 'UNKNOWN';
    // Handle numeric IDs or existing string formats
    const idNum = id.toString().replace(/\D/g, ''); 
    const year = new Date().getFullYear().toString().slice(-2);
    return `EB${idNum.padStart(5, '0')}/${year}`;
};

const sendEmail = async (to, subject, html) => {
    try {
        // Verify connection before attempting to send
        // Note: In high-traffic apps, verify() is usually run once on startup, 
        // but keeping it here ensures we catch connection errors per request for now.
        await transporter.verify();
        
        const info = await transporter.sendMail({
            from: `"EasyBills Admin" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html // Use 'html' instead of 'text' for better formatting if needed
        });
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email error:', error.message);
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
    const html = `
        <h3>Dear Faculty,</h3>
        <p>Your claim <strong>#${fmtId}</strong> for <strong>₹${amount}</strong> has been submitted and is Pending Approval.</p>
        <hr />
        <p>EasyBills Team</p>
    `;
    return sendEmail(email, subject, html);
};

// 2. APPROVED -> PENDING PAYMENT
exports.sendApprovalEmail = async ({ email, claimId, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: Approved`;
    const html = `
        <h3>Dear Faculty,</h3>
        <p><strong>Expense Claim Status Update</strong></p>
        <p><strong>Claim ID:</strong> ${fmtId}</p>
        <p><strong>New Status:</strong> <span style="color: green;">Pending Payment (Approved)</span></p>
        <p><strong>Notes:</strong> ${notes || 'Your claim has been reviewed and approved.'}</p>
        <hr />
        <p>Please log in to the EasyBills portal to view full details.</p>
    `;
    return sendEmail(email, subject, html);
};

// 3. REFERRED BACK
exports.sendClarificationRequest = async ({ email, claimId, clarificationNotes }) => {
    const fmtId = formatID(claimId);
    const subject = `Clarification Needed for Claim #${fmtId}`;
    const html = `
        <h3 style="color: #d35400;">Action Required</h3>
        <p><strong>Claim ID:</strong> ${fmtId}</p>
        <p><strong>Status:</strong> <span style="color: #d35400;">Referred Back</span></p>
        <p><strong>Reason:</strong><br/>${clarificationNotes || 'Please provide itemized receipts for all expenses claimed.'}</p>
        <hr />
        <p>Reply by logging into the EasyBills portal and updating your claim.</p>
    `;
    return sendEmail(email, subject, html);
};

// 4. REJECTED
exports.sendRejectionEmail = async ({ email, claimId, rejectionReason }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: Rejected`;
    const html = `
        <h3 style="color: #c0392b;">Claim Rejected</h3>
        <p>Dear Faculty,</p>
        <p>Your claim <strong>#${fmtId}</strong> has been Rejected.</p>
        <p><strong>Reason:</strong><br/>${rejectionReason || 'Claim does not meet policy guidelines.'}</p>
        <hr />
        <p>Please contact the Accounts department if you have questions.</p>
    `;
    return sendEmail(email, subject, html);
};

// 5. PAID / DISBURSED
exports.sendPaymentEmail = async ({ email, claimId, amountPaid, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Payment Disbursed for Claim #${fmtId}`;
    const html = `
        <h3 style="color: #27ae60;">Payment Processed</h3>
        <p>Dear Faculty,</p>
        <p>Good news! Payment for Claim <strong>#${fmtId}</strong> has been processed.</p>
        <p><strong>Amount Disbursed:</strong> ₹${amountPaid}</p>
        <p><strong>Status:</strong> Disbursed</p>
        <p><strong>Notes:</strong> ${notes || 'Payment transferred to your account.'}</p>
        <hr />
        <p>Thank you,<br/>EasyBills Finance Team</p>
    `;
    return sendEmail(email, subject, html);
};

// 6. GENERIC
exports.sendStatusNotification = async ({ email, claimId, status, notes }) => {
    const fmtId = formatID(claimId);
    const subject = `Claim #${fmtId} Status Update: ${status}`;
    const html = `<p>Status updated to <strong>${status}</strong>.</p><p>Notes: ${notes}</p>`;
    return sendEmail(email, subject, html);
};