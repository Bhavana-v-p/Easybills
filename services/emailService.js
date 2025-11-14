// services/emailService.js

const transporter = require('../config/mailer');

/**
 * Send status change notification email to faculty member
 * @param {Object} options - { email, claimId, status, notes }
 */
exports.sendStatusNotification = async (options) => {
  const { email, claimId, status, notes } = options;

  const subject = `Claim #${claimId} Status Update: ${status}`;
  const htmlContent = `
    <h2>Expense Claim Status Update</h2>
    <p><strong>Claim ID:</strong> ${claimId}</p>
    <p><strong>New Status:</strong> ${status}</p>
    <p><strong>Notes:</strong> ${notes || 'No additional notes'}</p>
    <hr />
    <p>Please log in to the EasyBills portal to view full details.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Status notification sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send clarification request email (if status changes to 'clarification needed')
 * @param {Object} options - { email, claimId, clarificationNotes }
 */
exports.sendClarificationRequest = async (options) => {
  const { email, claimId, clarificationNotes } = options;

  const subject = `Clarification Needed for Claim #${claimId}`;
  const htmlContent = `
    <h2>Action Required: Clarification Needed</h2>
    <p><strong>Claim ID:</strong> ${claimId}</p>
    <p><strong>Please provide:</strong></p>
    <p>${clarificationNotes}</p>
    <hr />
    <p>Reply by logging into the EasyBills portal and updating your claim.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Clarification email sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending clarification email:', error);
    return { success: false, error: error.message };
  }
};
