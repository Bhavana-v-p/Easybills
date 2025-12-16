const { Resend } = require('resend');

// 1. Initialize Resend with your API Key
// This uses HTTP (Port 443) which works perfectly on Render
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to format ID for Email
const formatID = (id) => {
    if (!id) return 'UNKNOWN';
    const idNum = id.toString().replace(/\D/g, ''); 
    const year = new Date().getFullYear().toString().slice(-2);
    return `EB${idNum.padStart(5, '0')}/${year}`;
};

const sendEmail = async (to, subject, html) => {
    try {
        // ⚠️ IMPORTANT: On Free Tier, you must send FROM 'onboarding@resend.dev'
        // Emails will ONLY be delivered to the email address you registered with Resend.
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: to, 
            subject: subject,
            html: html
        });

        if (error) {
            console.error('❌ Email API Error:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Email sent successfully via API to ${to}. ID: ${data.id}`);
        return { success: true };
    } catch (err) {
        console.error('❌ Unexpected Email Error:', err.message);
        return { success: false, error: err.message };
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
        <h3>Dear Faculty,</h3>
        <p>Your claim <strong>#${fmtId}</strong> requires additional information before it can be processed.</p>
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