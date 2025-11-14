// services/emailService.js

const transporter = require('../config/mailer');
const emailTemplates = require('./emailTemplates');

/**
 * Send status change notification email to faculty member
 * @param {Object} options - { email, claimId, status, notes }
 */
exports.sendStatusNotification = async (options) => {
  const { email, claimId, status, notes } = options;

  const subject = `Claim #${claimId} Status Update: ${status}`;
  const htmlContent = emailTemplates.statusChangeTemplate(claimId, status, notes);

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
  const htmlContent = emailTemplates.clarificationTemplate(claimId, clarificationNotes);

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

/**
 * Send rejection email
 * @param {Object} options - { email, claimId, rejectionReason }
 */
exports.sendRejectionEmail = async (options) => {
  const { email, claimId, rejectionReason } = options;

  const subject = `Claim #${claimId} Rejected`;
  const htmlContent = emailTemplates.rejectedTemplate(claimId, rejectionReason);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Rejection email sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send approval email
 * @param {Object} options - { email, claimId, approvalNotes }
 */
exports.sendApprovalEmail = async (options) => {
  const { email, claimId, approvalNotes } = options;

  const subject = `Claim #${claimId} Approved`;
  const htmlContent = emailTemplates.approvedTemplate(claimId, approvalNotes);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Approval email sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment email
 * @param {Object} options - { email, claimId, amountPaid }
 */
exports.sendPaymentEmail = async (options) => {
  const { email, claimId, amountPaid } = options;

  const subject = `Claim #${claimId} Reimbursement Processed`;
  const htmlContent = emailTemplates.paidTemplate(claimId, amountPaid);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Payment email sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending payment email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send submission confirmation email
 * @param {Object} options - { email, claimId, amount }
 */
exports.sendSubmissionConfirmation = async (options) => {
  const { email, claimId, amount } = options;

  const subject = `Claim #${claimId} Submitted Successfully`;
  const htmlContent = emailTemplates.submittedTemplate(claimId, amount);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent
    });

    console.log(`Submission confirmation email sent to ${email} for claim #${claimId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending submission email:', error);
    return { success: false, error: error.message };
  }
};
