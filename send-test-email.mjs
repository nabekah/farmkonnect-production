import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is not configured');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const recipientEmail = 'abekah.ekow@gmail.com';
const fromEmail = 'noreply@farmconnekt.com'; // Using verified sender email from SendGrid

const htmlContent = `
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to FarmKonnect!</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Hello,
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

async function sendTestEmail() {
  try {
    console.log(`📧 Sending test email to ${recipientEmail}...`);
    
    const response = await sgMail.send({
      to: recipientEmail,
      from: fromEmail,
      subject: 'FarmKonnect Test Email',
      html: htmlContent,
    });

    console.log('✅ Email sent successfully!');
    console.log(`📬 Recipient: ${recipientEmail}`);
    console.log(`📤 From: ${fromEmail}`);
    console.log(`📋 Subject: FarmKonnect Test Email`);
    console.log(`📊 Response ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    process.exit(1);
  }
}

sendTestEmail();
