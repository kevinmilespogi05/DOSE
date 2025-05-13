import { sendEmail } from './email';

async function testEmail() {
  try {
    await sendEmail({
      to: 'kevinmilesjulhusin99@gmail.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test email to verify the SMTP configuration.</p>'
    });
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail(); 