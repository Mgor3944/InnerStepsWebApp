// Netlify function to send verification emails using Postmark
const axios = require('axios');

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

    // Postmark API request
    const response = await axios({
      method: 'post',
      url: 'https://api.postmarkapp.com/email',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN
      },
      data: {
        From: 'support@innersteps.org',
        To: email,
        Subject: 'Verify Your Email',
        HtmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; text-align: center;">

            <h2 style="color: #42535F;">Email Verification</h2>
            <p style="font-size: 16px; color: #42535F;">Thank you for signing up to recieve progress insights!</p>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; margin-bottom: 5px;">Your verification code is:</p>
              <h1 style="color: #8DBA36; letter-spacing: 5px; margin: 15px 0;">${code}</h1>
              <p style="font-size: 12px; color: #777;">This code will expire in 10 minutes</p>
            </div>

            <p style="font-size: 14px; color: #42535F;">Please enter this code on the verification page to complete your registration.</p>
            <div style="margin: 20px 0;">
              <a href="javascript:window.history.back()" style="display: inline-block; padding: 12px 24px; background-color: #8DBA36; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </div>

            <p style="font-size: 14px; color: #42535F;">If you didn't request this code, please ignore this email.</p>
            <p style="font-size: 14px; color: #42535F;">Need help? Contact <a href="mailto:support@innersteps.org" style="font-weight: 500;">support@innersteps.org</a>.</p>
            
            <p style="font-size: 12px; color: #42535F;">Thank you for using InnerSteps!</p>
            <p style="font-size: 12px; color: #42535F;">Copyright© 2025 InnerSteps Pty Ltd. All rights reserved.</p>

          </div>
        `,
        TextBody: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you for using InnerSteps!`,
        MessageStream: "outbound"
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verification email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error sending verification email', 
        error: error.message,
        details: error.response ? error.response.data : null
      })
    };
  }
}; 