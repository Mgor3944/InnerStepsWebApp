# Email Verification Setup for InnerSteps

This document explains how to set up the email verification system for InnerSteps.

## Overview

The email verification system works as follows:

1. When a user enters their email address, a random 6-digit verification code is generated
2. This code is sent to the user's email address
3. The user enters the code to verify their email address
4. If the code matches, the user is allowed to proceed

## Setup Instructions

### 1. Netlify Environment Variables

You need to set up the following environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Build & deploy > Environment
3. Add the following environment variables:

```
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```

### 2. Email Service Provider

You need an SMTP service to send emails. Here are some options:

- **Gmail**: You can use your Gmail account, but you'll need to enable "Less secure app access" or use an App Password
- **SendGrid**: A popular email service with a free tier
- **Mailgun**: Another popular email service with a free tier
- **Amazon SES**: AWS's email service, very reliable but requires AWS account

### 3. Testing

To test the email verification:

1. In development mode, the verification code is displayed on the screen for testing purposes
2. In production, the code is only sent to the user's email

### 4. Troubleshooting

If emails are not being sent:

1. Check the Netlify function logs in your Netlify dashboard
2. Verify that your SMTP credentials are correct
3. Make sure your SMTP provider allows sending from your domain
4. Check if your email service has sending limits

## Email Template

The email sent to users includes:

- A header with the InnerSteps logo
- A message explaining the verification process
- The 6-digit verification code prominently displayed
- A note that the code expires in 10 minutes

## Security Considerations

- Verification codes expire after 10 minutes
- Codes are stored in localStorage for verification
- In a production environment, consider implementing rate limiting to prevent abuse 