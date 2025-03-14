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

    console.log('Sending verification email via Postmark API to:', email);

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
          <div style="font-family: Quicksand, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 30px;">

            <div style="background-color: #f9f9f9; padding: 40px; border-radius: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 30px;">

              <h2 style="color: #42535F; margin: 0; width: 100%; text-align: left;">Email Verification</h2>
              <p style="font-size: 16px; color: #42535F; margin: 0; width: 100%; text-align: left;">Thank you for signing up to recieve progress insights!</p>
              
              <div style="background-color: #8DBA361A; padding: 25px 20px; border-radius: 8px; width: 100%; box-sizing: border-box;">
                <p style="font-size: 14px; color: #42535F; margin: 0 0 15px 0; text-align: center;">Your verification code is:</p>
                
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                  <div style="background-color: #8DBA36; color: white; font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; border-radius: 5px; display: flex; align-items: center;">
                    ${code}
                    <span style="margin-left: 15px; cursor: pointer;" onclick="navigator.clipboard.writeText('${code}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" fill="white"/>
                        <path d="M17.1 2H12.9C9.5 2 8.1 3.3 8.03 6.5H11.1C15.5 6.5 17.5 8.5 17.5 12.9V15.97C20.7 15.9 22 14.5 22 11.1V6.9C22 3.4 20.6 2 17.1 2Z" fill="white"/>
                      </svg>
                    </span>
                  </div>
                </div>
                
                <p style="font-size: 12px; color: #777; margin: 0; text-align: center;">This code will expire in 10 minutes</p>
              </div>
              
              <p style="font-size: 14px; color: #42535F; margin: 0; text-align: center; width: 100%;">Please enter this code on the email verification page to begin receiving progress insights.</p>
              
              <div style="display: flex; flex-direction: column; gap: 15px; width: 100%;">
                <p style="font-size: 14px; color: #42535F; margin: 0;">Thank you for using InnerSteps!</p>
                <p style="font-size: 14px; color: #42535F; margin: 0;">Need help? Contact <a href="mailto:support@innersteps.org" style="color: #42535F; font-weight: 500;">support@innersteps.org</a></p>
                <p style="font-size: 14px; color: #42535F; margin: 0;">Copyright© 2025 InnerSteps Pty Ltd. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
        TextBody: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you for using InnerSteps!`,
        MessageStream: "outbound"
      }
    });

    console.log('Postmark API response:', response.status, response.statusText);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verification email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Postmark API error response:', error.response.status, error.response.data);
    }
    
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