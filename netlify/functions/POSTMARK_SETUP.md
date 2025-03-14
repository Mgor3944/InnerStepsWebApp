# Setting Up Postmark for InnerSteps Email Verification

This guide will help you set up Postmark to send verification emails for InnerSteps.

## Why Postmark?

Postmark is a premium transactional email service known for:

- Industry-leading deliverability rates
- Excellent customer support
- Simple, transparent pricing
- Detailed analytics and reporting
- Fast delivery times

## Step 1: Create a Postmark Account

1. Go to [Postmark's website](https://postmarkapp.com/) and sign up for an account
2. Complete the verification process
3. Log in to your Postmark dashboard

## Step 2: Create a Server

In Postmark, a "Server" is a container for your emails:

1. From your dashboard, click **Create Server**
2. Name it "InnerSteps Verification"
3. Select **Live** as the server type (to deliver messages to recipients)
4. Choose a color label if desired
5. Click **Create Server**

## Step 3: Message Streams

Postmark automatically creates message streams for different types of emails:

1. In your server dashboard, click on **Message Streams** in the left navigation
2. You should see these default streams:
   - **Default Transactional Stream** - For time-sensitive emails to one recipient
   - **InnerSteps Verification** - A custom stream with your server name
   - **Default Inbound Stream** - For receiving emails

Our code is configured to use the "InnerSteps Verification" message stream.

## Step 4: Verify Your Sender Identity

Before you can send emails, you need to verify your sender domain or email address:

### Option A: Verify a Sender Signature (Quick Start)

1. In your server, go to **Sender Signatures** in the top navigation
2. Click **Add Sender Signature**
3. Enter your email address (no-reply@innersteps.org)
4. Click **Save**
5. Check the inbox for a verification email and click the confirmation link

### Option B: Verify Your Domain (Recommended)

1. In your server, go to **Domains** (under Sender Signatures in the top navigation)
2. Click **Add Domain**
3. Enter your domain (innersteps.org)
4. Follow the instructions to add the required DNS records:
   - SPF record
   - DKIM record
   - Return-Path record
   - DMARC record (optional but recommended)
5. Wait for DNS verification (can take up to 24 hours)

## Step 5: Get Your API Token

1. In your server, click on **API Tokens** in the left navigation
2. Copy the **Server API Token**
3. Keep this token secure - you'll need it for your Netlify function

## Step 6: Add the API Token to Netlify

1. Go to your Netlify dashboard
2. Navigate to **Site settings** > **Build & deploy** > **Environment**
3. Add a new environment variable:
   - Key: `POSTMARK_API_TOKEN`
   - Value: [Your Postmark Server API Token]
4. Click **Save**
5. **Remove old SMTP variables**: You can safely remove any previous SMTP-related environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE) as they are no longer needed with the Postmark API

## Step 7: Request Account Approval (Moving from Test Mode)

When you first create a Postmark account, it starts in test mode with these limitations:
- You can only send 100 emails
- You can only send to verified domains/email addresses
- Emails will have a "TEST" label in the subject line

To move to production mode:

1. Verify your domain or sender signature (from Step 4)
2. Click the **Request approval** button in the yellow banner at the top of your dashboard
3. Complete the approval form with information about how you plan to use Postmark
4. Wait for Postmark's team to review your request (usually within 1 business day)

While in test mode, you can still test your email verification system by:
- Using your own email address for testing
- Verifying the email addresses you want to test with

## Step 8: Deploy Your Site

1. Trigger a new deployment in Netlify to apply the changes
2. You can do this by going to the **Deploys** tab and clicking **Trigger deploy**

## Step 9: Test the Email Verification

1. Go to your InnerSteps website
2. Enter an email address and submit the form
3. Check if you receive the verification email
4. Verify that it arrives quickly and doesn't go to spam

## Monitoring and Analytics

Postmark provides excellent tools to monitor your emails:

1. **Message Activity**: View all sent emails, opens, and clicks
2. **Bounces**: Track and manage bounced emails
3. **Spam Complaints**: Monitor and address spam complaints
4. **Statistics**: View delivery rates, open rates, and more

## Troubleshooting

If emails are not being sent:

1. Check the Netlify function logs for errors
2. Verify that your API token is correct
3. Make sure your sender identity is verified
4. Check Postmark's Message Activity to see if the emails are being processed

## Best Practices

1. **Monitor your reputation**: Regularly check your Postmark dashboard for bounces or spam complaints
2. **Test deliverability**: Send test emails to different email providers
3. **Use both HTML and text versions**: Always include both formats in your emails
4. **Keep your templates simple**: Avoid complex HTML or large images
5. **Follow email regulations**: Ensure compliance with GDPR, CAN-SPAM, etc. 