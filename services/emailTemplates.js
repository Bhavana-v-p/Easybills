// services/emailTemplates.js

/**
 * Email templates for claim status notifications
 * Each template returns HTML content for the email body
 */

exports.statusChangeTemplate = (claimId, status, notes) => {
  const statusColors = {
    submitted: '#3498db',
    verified: '#f39c12',
    approved: '#27ae60',
    paid: '#2ecc71',
    'clarification needed': '#e74c3c'
  };

  const color = statusColors[status] || '#95a5a6';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .status-badge { display: inline-block; background-color: ${color}; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
          .detail { margin: 15px 0; }
          .label { font-weight: bold; color: #555; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Expense Claim Status Update</h2>
          </div>
          <div class="content">
            <div class="detail">
              <span class="label">Claim ID:</span> #${claimId}
            </div>
            <div class="detail">
              <span class="label">New Status:</span>
              <span class="status-badge">${status.toUpperCase()}</span>
            </div>
            <div class="detail">
              <span class="label">Notes:</span>
              <p>${notes || 'No additional notes provided.'}</p>
            </div>
            <hr />
            <p>Please log in to the <strong>EasyBills portal</strong> to view full details of your claim and any required actions.</p>
            <p>If you have any questions, please contact the Finance team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.clarificationTemplate = (claimId, clarificationNotes) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 3px; margin: 15px 0; }
          .checklist { margin: 15px 0; padding-left: 20px; }
          .checklist li { margin: 8px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Action Required: Clarification Needed</h2>
          </div>
          <div class="content">
            <p>Your expense claim <strong>#${claimId}</strong> requires additional information before it can be processed.</p>
            <div class="warning">
              <strong>Please provide the following:</strong>
              <div class="checklist">
                ${clarificationNotes || 'Please contact the Finance team for details.'}
              </div>
            </div>
            <h3>Next Steps:</h3>
            <ol>
              <li>Log in to the EasyBills portal</li>
              <li>Navigate to your claim #${claimId}</li>
              <li>Update your claim with the requested information</li>
              <li>Resubmit for review</li>
            </ol>
            <p><strong>Deadline:</strong> Please submit clarifications within 7 business days.</p>
            <hr />
            <p>If you have any questions, please contact the Finance team immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.rejectedTemplate = (claimId, rejectionReason) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #c0392b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .reason-box { background-color: #fadbd8; border-left: 4px solid #c0392b; padding: 15px; margin: 15px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Claim Rejected</h2>
          </div>
          <div class="content">
            <p>Unfortunately, your expense claim <strong>#${claimId}</strong> has been rejected.</p>
            <div class="reason-box">
              <strong>Reason for rejection:</strong>
              <p>${rejectionReason || 'Please contact Finance for details.'}</p>
            </div>
            <h3>What happens next?</h3>
            <ul>
              <li>You may resubmit a new claim with corrections</li>
              <li>Contact the Finance team if you believe this decision is incorrect</li>
              <li>Include any additional supporting documents in your resubmission</li>
            </ul>
            <hr />
            <p>For questions or to discuss this rejection, please contact the Finance team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.approvedTemplate = (claimId, approvalNotes) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #27ae60; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .success-badge { display: inline-block; background-color: #27ae60; color: white; padding: 10px 20px; border-radius: 3px; font-weight: bold; font-size: 18px; }
          .timeline { margin: 20px 0; }
          .timeline-item { margin: 15px 0; padding-left: 30px; border-left: 3px solid #27ae60; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✓ Claim Approved</h2>
          </div>
          <div class="content">
            <p style="text-align: center; margin: 20px 0;">
              <span class="success-badge">APPROVED</span>
            </p>
            <p>Congratulations! Your expense claim <strong>#${claimId}</strong> has been approved.</p>
            <div class="timeline">
              <div class="timeline-item">
                <strong>Approval Notes:</strong>
                <p>${approvalNotes || 'Your claim meets all requirements and has been approved for reimbursement.'}</p>
              </div>
              <div class="timeline-item">
                <strong>Next Step:</strong>
                <p>Your reimbursement will be processed and transferred to your account within 5-7 business days.</p>
              </div>
              <div class="timeline-item">
                <strong>Reference:</strong>
                <p>Claim ID: #${claimId}</p>
              </div>
            </div>
            <hr />
            <p>Thank you for submitting your expense claim. If you have any questions, please contact the Finance team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.paidTemplate = (claimId, amountPaid) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2ecc71; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .amount-box { background-color: #d5f4e6; border: 2px solid #2ecc71; padding: 20px; border-radius: 3px; margin: 20px 0; text-align: center; }
          .amount { font-size: 28px; font-weight: bold; color: #27ae60; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✓ Reimbursement Processed</h2>
          </div>
          <div class="content">
            <p>Your expense claim <strong>#${claimId}</strong> has been paid!</p>
            <div class="amount-box">
              <p>Amount Paid:</p>
              <div class="amount">${amountPaid || 'Processed'}</div>
            </div>
            <h3>Payment Details:</h3>
            <ul>
              <li><strong>Claim ID:</strong> #${claimId}</li>
              <li><strong>Status:</strong> PAID</li>
              <li><strong>Transfer Method:</strong> Direct bank transfer</li>
              <li><strong>Expected Arrival:</strong> 1-2 business days</li>
            </ul>
            <p>Please check your bank account for the credit. If you do not receive the payment within 2 business days, please contact the Finance team.</p>
            <hr />
            <p>Thank you for using EasyBills!</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.submittedTemplate = (claimId, amount) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3498db; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 5px 5px; }
          .confirmation-box { background-color: #d6eaf8; border: 1px solid #3498db; padding: 15px; border-radius: 3px; margin: 15px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Claim Submitted Successfully</h2>
          </div>
          <div class="content">
            <p>Thank you for submitting your expense claim!</p>
            <div class="confirmation-box">
              <p><strong>Claim Reference:</strong> #${claimId}</p>
              <p><strong>Amount Claimed:</strong> ${amount || 'Pending review'}</p>
              <p><strong>Status:</strong> SUBMITTED - Under Review</p>
            </div>
            <h3>What happens next?</h3>
            <ol>
              <li>Your claim will be reviewed by the Finance team</li>
              <li>You will receive an email with updates on the status</li>
              <li>The typical review process takes 3-5 business days</li>
              <li>Once approved, payment will be processed</li>
            </ol>
            <p>You can check your claim status anytime by logging into the EasyBills portal.</p>
            <hr />
            <p>If you have questions about your claim, please contact the Finance team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from EasyBills. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
