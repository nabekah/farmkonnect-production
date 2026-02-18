# FarmKonnect Railway Environment Configuration

Copy and paste these environment variables into your Railway FarmKonnect app settings.

## Database Configuration (MySQL on Railway)

```
DATABASE_URL=mysql://root:zraDqTMKAwasWEoKCaAvLDCMdWmaKRox@${{RAILWAY_PRIVATE_DOMAIN}}:3306/railway
```

## Node Environment

```
NODE_ENV=production
PORT=3000
```

## OAuth & Authentication

Replace these with your actual Manus credentials:

```
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
JWT_SECRET=your_jwt_secret_key_change_in_production
OWNER_NAME=Admin
OWNER_OPEN_ID=your_owner_open_id
```

## Manus Built-in APIs

Replace with your actual keys:

```
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
```

## External APIs (Optional - leave empty if not using)

```
OPENWEATHER_API_KEY=your_openweather_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Notifications & Push

```
VAPID_PRIVATE_KEY=your_vapid_private_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## Analytics

```
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_analytics_website_id
```

## App Configuration

```
VITE_APP_TITLE=FarmKonnect
VITE_APP_LOGO=your_app_logo_url
```

---

## How to Add These to Railway

1. Go to your **FarmKonnect App** on Railway
2. Click **"Variables"** tab
3. Click **"Add Variable"** for each one
4. Or paste all at once if Railway supports bulk import

## Important Notes

- **DATABASE_URL** uses `${{RAILWAY_PRIVATE_DOMAIN}}` - This is the internal Railway network connection (faster, more secure)
- Replace all `your_*` values with your actual credentials
- Keep `MYSQL_ROOT_PASSWORD` secure - don't share it
- The MySQL connection is already configured and working

## Testing Connection

After adding variables, Railway will automatically:
1. Rebuild your app
2. Deploy with new environment variables
3. Connect to the MySQL database

Check the deployment logs to verify everything is working.
