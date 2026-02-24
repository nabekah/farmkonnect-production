# FarmKonnect Environment Variables Setup Checklist

Use this checklist to gather and configure all environment variables for Railway deployment.

---

## Step 1: Database Setup

### MySQL/TiDB Database
- [ ] Create database on Railway, PlanetScale, or AWS RDS
- [ ] Get connection string
- [ ] Format: `mysql://username:password@host:port/database`
- [ ] Test connection locally

**Value to add:**
```
DATABASE_URL=mysql://username:password@host:port/database
```

---

## Step 2: Security Setup

### JWT Secret
- [ ] Generate strong random secret: `openssl rand -hex 32`
- [ ] Copy the generated value
- [ ] Store securely (never share)

**Value to add:**
```
JWT_SECRET=<generated_random_value>
```

---

## Step 3: Google OAuth Setup

### Create Google OAuth Application
1. [ ] Go to https://console.cloud.google.com
2. [ ] Create new project (name: FarmKonnect)
3. [ ] Enable Google+ API
4. [ ] Create OAuth 2.0 credentials (Web application)
5. [ ] Add authorized redirect URIs:
   - `http://localhost:3000/api/oauth/google/callback` (dev)
   - `https://your-railway-domain.railway.app/api/oauth/google/callback` (prod)
6. [ ] Copy Client ID and Client Secret

**Values to add:**
```
GOOGLE_CLIENT_ID=<your_client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your_client_secret>
GOOGLE_REDIRECT_URL=https://your-railway-domain.railway.app/api/oauth/google/callback
```

---

## Step 4: Email Setup (SendGrid)

### Create SendGrid Account
1. [ ] Go to https://sendgrid.com
2. [ ] Sign up for free account
3. [ ] Verify email address
4. [ ] Go to Settings → API Keys
5. [ ] Create new API key (Full Access)
6. [ ] Copy API key
7. [ ] Add verified sender email

**Values to add:**
```
SENDGRID_API_KEY=SG.<your_api_key>
SENDGRID_FROM_EMAIL=noreply@farmkonnect.com
```

---

## Step 5: SMS Setup (Twilio)

### Create Twilio Account
1. [ ] Go to https://www.twilio.com
2. [ ] Sign up for account
3. [ ] Go to Console → Account Info
4. [ ] Copy Account SID
5. [ ] Copy Auth Token
6. [ ] Go to Phone Numbers → Buy a number
7. [ ] Copy phone number

**Values to add:**
```
TWILIO_ACCOUNT_SID=<your_account_sid>
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Step 6: Google Maps Setup

### Create Google Maps API Key
1. [ ] Go to https://console.cloud.google.com (same project as OAuth)
2. [ ] Enable Maps JavaScript API
3. [ ] Enable Places API (optional)
4. [ ] Enable Geocoding API (optional)
5. [ ] Create API key (restrict to HTTP referrers)
6. [ ] Add your domain: `*.railway.app`
7. [ ] Copy API key

**Value to add:**
```
GOOGLE_MAPS_API_KEY=<your_api_key>
```

---

## Step 7: AWS S3 Setup

### Create AWS S3 Bucket
1. [ ] Go to https://console.aws.amazon.com
2. [ ] Create S3 bucket (name: `farmkonnect-prod-bucket`)
3. [ ] Note the region (e.g., `us-east-1`)
4. [ ] Create IAM user for S3 access
5. [ ] Attach S3 policy to user
6. [ ] Create access key
7. [ ] Copy Access Key ID
8. [ ] Copy Secret Access Key

**Values to add:**
```
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>
AWS_S3_BUCKET=farmkonnect-prod-bucket
AWS_REGION=us-east-1
```

---

## Step 8: Weather Setup (OpenWeather)

### Create OpenWeather Account
1. [ ] Go to https://openweathermap.org
2. [ ] Sign up for free account
3. [ ] Go to API keys section
4. [ ] Copy default API key

**Value to add:**
```
OPENWEATHER_API_KEY=<your_api_key>
```

---

## Step 9: Push Notifications Setup

### Generate VAPID Keys
1. [ ] Install web-push: `npm install -g web-push`
2. [ ] Generate keys: `web-push generate-vapid-keys`
3. [ ] Copy Private Key
4. [ ] Copy Public Key

**Values to add:**
```
VAPID_PRIVATE_KEY=<your_private_key>
VITE_VAPID_PUBLIC_KEY=<your_public_key>
```

---

## Step 10: Frontend Configuration

### Configure Frontend URLs
1. [ ] Get your Railway domain: `https://your-project.railway.app`
2. [ ] Or use custom domain if configured

**Values to add:**
```
VITE_FRONTEND_URL=https://your-railway-domain.railway.app
VITE_APP_TITLE=FarmKonnect - Digital Agriculture Management
VITE_APP_LOGO=https://your-railway-domain.railway.app/logo.png
```

---

## Step 11: Analytics Setup (Optional)

### Configure Analytics
1. [ ] Choose analytics provider (Plausible, Mixpanel, etc.)
2. [ ] Create account and get endpoint
3. [ ] Get website ID

**Values to add (if using analytics):**
```
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=<your_website_id>
```

---

## Step 12: Railway Setup

### Configure Railway Deployment
1. [ ] Go to https://railway.app
2. [ ] Create new project
3. [ ] Connect GitHub repository
4. [ ] Go to Project → Variables
5. [ ] Add all environment variables from above
6. [ ] Set NODE_ENV=production

**Value to add:**
```
NODE_ENV=production
```

---

## Step 13: GitHub Actions Setup

### Add GitHub Secrets
1. [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
2. [ ] Add all environment variables as secrets
3. [ ] Include Railway deployment secrets:

**Additional secrets for GitHub Actions:**
```
RAILWAY_TOKEN=<your_railway_api_token>
RAILWAY_PROJECT_ID=<your_railway_project_id>
```

---

## Complete Environment Variables List

### Required (Must Have)
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GOOGLE_REDIRECT_URL
- [ ] SENDGRID_API_KEY
- [ ] SENDGRID_FROM_EMAIL
- [ ] GOOGLE_MAPS_API_KEY
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_S3_BUCKET
- [ ] AWS_REGION
- [ ] OPENWEATHER_API_KEY
- [ ] VAPID_PRIVATE_KEY
- [ ] VITE_VAPID_PUBLIC_KEY
- [ ] VITE_FRONTEND_URL
- [ ] NODE_ENV

### Optional (Nice to Have)
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER
- [ ] VITE_APP_TITLE
- [ ] VITE_APP_LOGO
- [ ] VITE_ANALYTICS_ENDPOINT
- [ ] VITE_ANALYTICS_WEBSITE_ID

### For GitHub Actions
- [ ] RAILWAY_TOKEN
- [ ] RAILWAY_PROJECT_ID

---

## Testing Checklist

After adding all variables:

### Local Testing
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test login with Google
- [ ] Test email sending (check SendGrid logs)
- [ ] Test file upload (check S3)
- [ ] Test map display

### Railway Testing
- [ ] Push to GitHub
- [ ] Watch GitHub Actions deploy
- [ ] Check Railway deployment logs
- [ ] Visit production URL
- [ ] Test login with Google
- [ ] Test all features
- [ ] Check logs for errors

### Production Verification
- [ ] [ ] Login works
- [ ] [ ] Email notifications send
- [ ] [ ] Maps display correctly
- [ ] [ ] File uploads work
- [ ] [ ] Weather data loads
- [ ] [ ] No errors in logs

---

## Troubleshooting

### "Database connection failed"
- [ ] Verify DATABASE_URL is correct
- [ ] Check database is running
- [ ] Verify credentials are correct
- [ ] Check firewall allows connection

### "Google OAuth failed"
- [ ] Verify GOOGLE_CLIENT_ID is correct
- [ ] Verify GOOGLE_REDIRECT_URL matches Google Console
- [ ] Check Google+ API is enabled
- [ ] Verify credentials are not expired

### "SendGrid email failed"
- [ ] Verify SENDGRID_API_KEY is correct
- [ ] Check sender email is verified
- [ ] Verify API key has email sending permission
- [ ] Check SendGrid account is active

### "AWS S3 access denied"
- [ ] Verify AWS credentials are correct
- [ ] Check S3 bucket name is correct
- [ ] Verify IAM user has S3 permissions
- [ ] Check bucket region is correct

### "Maps not displaying"
- [ ] Verify GOOGLE_MAPS_API_KEY is correct
- [ ] Check Maps JavaScript API is enabled
- [ ] Verify API key is not restricted
- [ ] Check domain is whitelisted

---

## Security Reminders

✅ **DO:**
- [ ] Store secrets in GitHub/Railway, not in git
- [ ] Use strong random values
- [ ] Rotate secrets every 3 months
- [ ] Use separate keys for dev/prod
- [ ] Restrict API keys to specific domains
- [ ] Enable 2FA on all service accounts

❌ **DON'T:**
- [ ] Commit .env to git
- [ ] Share secrets in chat/email
- [ ] Use weak passwords
- [ ] Reuse secrets across services
- [ ] Commit API keys to code
- [ ] Use example values in production

---

## Next Steps

1. [ ] Complete all checklist items above
2. [ ] Add all secrets to GitHub Actions
3. [ ] Add all variables to Railway
4. [ ] Test deployment
5. [ ] Monitor logs
6. [ ] Set up alerts

**Estimated time:** 1-2 hours
**Difficulty:** Low
**Support:** Refer to ENV_VARIABLES_GUIDE.md for detailed instructions

---

## Quick Reference

| Service | Status | Setup Time |
|---------|--------|-----------|
| Database | ⏳ Required | 10 min |
| Google OAuth | ⏳ Required | 15 min |
| SendGrid | ⏳ Required | 10 min |
| Google Maps | ⏳ Required | 10 min |
| AWS S3 | ⏳ Required | 20 min |
| OpenWeather | ⏳ Required | 5 min |
| Twilio | ⏳ Optional | 10 min |
| Push Notifications | ⏳ Required | 5 min |

**Total estimated setup time: 1-2 hours**

---

**Remember:** Never skip any required variables! They are essential for production deployment.
