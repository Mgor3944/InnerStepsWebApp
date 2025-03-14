# Postmark Setup for InnerSteps

## Quick Setup Steps

1. **Create Postmark Account**: Sign up at [postmarkapp.com](https://postmarkapp.com/)

2. **Create Server**:
   - Dashboard → Create Server → Name "InnerSteps"
   - Select "Live" mode

3. **Verify Sender**:
   - Option A (Quick): Sender Signatures → Add → Enter support@innersteps.org → Verify email
   - Option B (Better): Domains → Add Domain → innersteps.org → Add DNS records

4. **Get API Token**:
   - API Tokens → Copy Server API Token

5. **Add to Netlify**:
   - Netlify Dashboard → Site settings → Environment
   - Add: `POSTMARK_API_TOKEN` = [Your Token]

6. **Deploy & Test**:
   - Trigger new deploy
   - Test with your own email

## Troubleshooting

- Check Netlify function logs
- Verify API token is correct
- Ensure sender is verified
- Check Postmark Message Activity

## Notes

- Default message stream is "outbound"
- New accounts start in test mode (100 email limit)
- Request production approval after verifying domain 