// Netlify function to send verification emails
const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the form data
    const payload = JSON.parse(event.body);
    const email = payload.email;
    const code = payload.code;
    
    if (!email || !code) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: 'Email and verification code are required' }) 
      };
    }

    // Create a transporter using environment variables
    // You'll need to set these in your Netlify environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `"InnerSteps App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'InnerSteps Email Verification Code',
      text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you for using InnerSteps!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #42535F; text-align: center;">InnerSteps Verification</h2>
          <p style="font-size: 16px; color: #42535F;">Thank you for signing up for InnerSteps progress insights!</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; margin-bottom: 5px;">Your verification code is:</p>
            <h1 style="color: #8DBA36; letter-spacing: 5px; margin: 10px 0;">${code}</h1>
            <p style="font-size: 12px; color: #777;">This code will expire in 10 minutes</p>
          </div>
          <p style="font-size: 14px; color: #42535F;">Please enter this code on the verification page to complete your registration.</p>
          <p style="font-size: 14px; color: #42535F;">Thank you for using InnerSteps!</p>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verification email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending verification email', error: error.message })
    };
  }
}; 