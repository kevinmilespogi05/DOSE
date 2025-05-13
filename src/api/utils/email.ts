import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD?.replace(/\s+/g, ''),
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify the connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    console.log('Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}; 