# Stripe Setup Instructions for Sherpa Economy Website

## Overview
This setup integrates Stripe payments for:
- Book pre-orders ($24.99)
- Consulting consultations ($250)
- Speaking engagement deposits ($1,000)
- Assessment reports ($49.99)

## 1. Stripe Account Setup

### Create Stripe Account
1. Go to [Stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Enable your account for live payments

### Get API Keys
1. Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

## 2. Update Configuration

### Update stripe-config.js
Replace the placeholder in `stripe-config.js`:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...'; // Replace with your actual publishable key
```

### Set Environment Variables
Create a `.env` file in your project root with:
```
STRIPE_PUBLISHABLE_KEY=pk_live_AwTlcHPBYYURE75CNMwpq6XE  # Your live publishable key
STRIPE_SECRET_KEY=sk_live_SDimTmsQzRG8I4L9K37mEpU4       # Your live secret key
STRIPE_WEBHOOK_SECRET=whsec_...                          # Webhook secret (see step 4)
```

## 3. Install Dependencies

Run the following command to install required packages:
```bash
npm install
```

## 4. Set Up Webhooks

### Create Webhook Endpoint
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-domain.netlify.app/.netlify/functions/stripe-webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the webhook signing secret (starts with `whsec_`)

### Update Environment Variables
Add the webhook secret to your environment variables.

## 5. Deploy to Netlify

### 🔐 CRITICAL: Set Environment Variables in Netlify
**SECURITY WARNING**: Never put your secret key in client-side code!

1. Go to your Netlify site dashboard
2. Go to **Site settings** → **Environment variables**
3. Add these variables (EXACT NAMES REQUIRED):
   - `STRIPE_SECRET_KEY`: `sk_live_SDimTmsQzRG8I4L9K37mEpU4`
   - `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret (from step 4)

**⚠️ IMPORTANT**: The secret key should ONLY exist in Netlify environment variables, never in your code files!

### Deploy
Your site will automatically deploy when you push changes to your repository.

## 6. Test the Integration

### Test Mode
- Use Stripe test mode first
- Test card numbers: `4242 4242 4242 4242` (Visa)
- Use any future expiration date and any CVC

### Live Mode
- Switch to live mode in Stripe Dashboard
- Update your publishable key in the code
- Test with real payment methods

## 7. Product Pricing Configuration

Current pricing is set in `stripe-config.js`:
- Book: $24.99 (2499 cents)
- Consultation: $250.00 (25000 cents)
- Speaking: $1,000.00 (100000 cents)
- Assessment: $49.99 (4999 cents)

To change prices, update the `PRODUCTS` object in `stripe-config.js`.

## 8. Email Notifications (Optional)

The webhook handler includes email notification functions that you can implement with your preferred email service (SendGrid, Mailgun, etc.).

Update the email functions in `netlify/functions/stripe-webhook.js` to integrate with your email service.

## 9. 🔐 Security Considerations - CRITICAL

### **✅ What's SECURE in Your Current Setup:**
- Secret key is ONLY in server-side Netlify Functions
- Client-side code only uses publishable key (safe to expose)
- Webhooks verify signatures to prevent tampering
- All payment processing happens server-side

### **🚨 NEVER DO THESE:**
- ❌ Put `sk_live_...` or `sk_test_...` in any JavaScript file
- ❌ Commit secret keys to Git/GitHub
- ❌ Store secrets in `.env` files that get committed
- ❌ Use secret keys in browser console or client-side

### **✅ Security Verification:**
1. Search your codebase for `sk_live_` - should find ZERO results in client files
2. Check browser developer tools - no secret keys should be visible
3. Verify environment variables are set in Netlify dashboard
4. Test that webhooks verify signatures properly

### **🆘 If Secret Key is Compromised:**
1. Immediately regenerate it in Stripe Dashboard
2. Update Netlify environment variable
3. Deploy your site
4. Test everything still works

## 10. Testing Checklist

- [ ] Book pre-order payment works
- [ ] Consulting consultation booking works
- [ ] Speaking engagement deposit works
- [ ] Assessment report purchase works
- [ ] Payment success redirects properly
- [ ] Payment failure handling works
- [ ] Webhooks receive events correctly
- [ ] Email notifications send (if implemented)

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Support](https://support.stripe.com)

## Files Created/Modified

### New Files:
- `stripe-config.js` - Stripe configuration and payment functions
- `payment-components.js` - UI components for payment modals
- `payment-styles.css` - Styles for payment interface
- `netlify/functions/create-payment-intent.js` - Server function for creating payments
- `netlify/functions/stripe-webhook.js` - Webhook handler for payment events
- `package.json` - Dependencies

### Modified Files:
- `sherpa-economy-landing.html` - Added book pre-order payments
- `consulting.html` - Added consultation booking payments
- `speaking.html` - Added speaking engagement deposits
- `sherpa-assessment.html` - Added premium report option

## Next Steps

1. Set up your Stripe account and get API keys
2. Update the configuration files with your keys
3. Test in Stripe test mode
4. Deploy to Netlify with environment variables
5. Set up webhooks
6. Switch to live mode when ready
7. Implement email notifications (optional)

Your Stripe integration is now ready to process payments for your Sherpa Economy services!
