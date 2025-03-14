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
          <div style="font-family: Quicksand, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 30px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; border-radius: 10px; padding: 40px;">
              <tr>
                <td align="left" style="padding-bottom: 15px;">
                  <h1 style="color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Email Verification</h1>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-bottom: 30px;">
                  <p style="font-size: 16px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Thank you for signing up to recieve progress insights!</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 30px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #8DBA361A; border-radius: 8px; padding: 25px 20px;">
                    <tr>
                      <td align="center" style="padding-bottom: 15px;">
                        <p style="font-size: 14px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Your verification code is:</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 15px;">
                        <table cellpadding="0" cellspacing="0" border="0" align="center">
                          <tr>
                            <td style="background-color: #8DBA36; color: white; font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; border-radius: 5px; font-family: Quicksand, Arial, sans-serif;">
                              ${code}
                              <img src="https://innersteps.org/assets/icons/copy-icon.png" alt="Copy" width="20" height="20" style="vertical-align: middle; margin-left: 15px;" />
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="font-size: 12px; color: #777; margin: 0; font-family: Quicksand, Arial, sans-serif;">This code will expire in 10 minutes</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-bottom: 30px;">
                  <p style="font-size: 14px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Please enter this code on the email verification page to begin receiving progress insights.</p>
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <p style="font-size: 14px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Thank you for using InnerSteps!</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <p style="font-size: 14px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Need help? Contact <a href="mailto:support@innersteps.org" style="color: #42535F; font-weight: 500; font-family: Quicksand, Arial, sans-serif;">support@innersteps.org</a></p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="font-size: 14px; color: #42535F; margin: 0; font-family: Quicksand, Arial, sans-serif;">Copyright© 2025 InnerSteps Pty Ltd. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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