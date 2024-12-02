import nodemailer from 'nodemailer';
import 'dotenv/config';

async function testEmail() {
  // Create a test transporter using your .env credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Test email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'test-recipient@example.com', // Replace with your test recipient
    subject: 'Test Email',
    text: 'If you receive this email, your email configuration is working correctly!'
  };

  try {
    // Send test email
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail(); 