const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY not set');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

const recipientEmail = 'sharetekgh@gmail.com';
const fromEmail = 'noreply@farmconnekt.com';
const subject = 'FarmKonnect Test Email';

const htmlContent = `
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to FarmKonnect!</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Hello User,
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          This is a test email to confirm that your email notifications are working correctly.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          You can now receive important updates about your farms, crops, and tasks directly in your inbox.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
          <p>FarmKonnect Team</p>
          <p>© 2026 FarmKonnect. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;

const msg = {
  to: recipientEmail,
  from: fromEmail,
  subject: subject,
  html: htmlContent,
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Recipient: ${recipientEmail}`);
    console.log(`📤 From: ${fromEmail}`);
    console.log(`📝 Subject: ${subject}`);
  })
  .catch((error) => {
    console.error('❌ Error sending test email:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', error.response.body);
    }
    process.exit(1);
  });
