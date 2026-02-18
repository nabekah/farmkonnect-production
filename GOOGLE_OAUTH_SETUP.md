# Google OAuth Setup Guide for FarmKonnect

This guide will help you set up Google OAuth authentication for FarmKonnect, enabling users to sign in with their Google accounts.

## Overview

FarmKonnect now supports hybrid authentication:
- **Manus OAuth** (existing) - for backward compatibility
- **Google OAuth** (new) - for users to sign in with Google accounts

## Prerequisites

1. A Google Cloud Project
2. Access to Google Cloud Console
3. Your FarmKonnect domain (e.g., www.farmconnekt.com)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "FarmKonnect"
5. Click "CREATE"
6. Wait for the project to be created and select it

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, click "CONFIGURE CONSENT SCREEN" first:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "FarmKonnect"
     - User support email: your email
     - Developer contact: your email
   - Click "SAVE AND CONTINUE"
   - Add scopes: `openid`, `email`, `profile`
   - Click "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"

4. Now create the OAuth client ID:
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "FarmKonnect Web Client"
   - Authorized JavaScript origins:
     - `https://www.farmconnekt.com`
     - `https://farmconnekt.com`
     - `http://localhost:3000` (for development)
     - `http://localhost:3001` (for development)
   - Authorized redirect URIs:
     - `https://www.farmconnekt.com/api/oauth/google/callback`
     - `https://farmconnekt.com/api/oauth/google/callback`
     - `http://localhost:3000/api/oauth/google/callback` (for development)
     - `http://localhost:3001/api/oauth/google/callback` (for development)
   - Click "CREATE"

5. Copy the credentials:
   - Client ID
   - Client Secret
   - **KEEP THESE SECRET!**

## Step 4: Configure FarmKonnect Environment Variables

Add the following environment variables to your FarmKonnect deployment:

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URL=https://www.farmconnekt.com/api/oauth/google/callback
```

### For Development:
```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URL=http://localhost:3001/api/oauth/google/callback
```

## Step 5: Update Manus Secrets

In the Manus dashboard:

1. Go to your FarmKonnect project settings
2. Navigate to "Secrets" section
3. Add the three environment variables above
4. Save and restart the dev server

## Step 6: Test Google OAuth

1. Go to your FarmKonnect application
2. On the login page, you should see a "Sign in with Google" button
3. Click it and test the authentication flow
4. You should be redirected back to the application after successful login

## Frontend Integration

The Google Sign-In button is already integrated in the login page. It's available via the `GoogleSignInButton` component:

```tsx
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function LoginPage() {
  return (
    <div>
      <GoogleSignInButton size="lg" className="w-full" />
    </div>
  );
}
```

## Backend Endpoints

### Get Google Authorization URL
```
GET /api/oauth/google/authorize?redirect_uri=<encoded_redirect_uri>
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Google OAuth Callback
```
GET /api/oauth/google/callback?code=<code>&state=<state>
```

This endpoint:
1. Exchanges the authorization code for tokens
2. Verifies the ID token
3. Creates or updates the user in the database
4. Sets the session cookie
5. Redirects to the home page

## Database Schema

New tables have been added to support Google OAuth:

### `users` table updates:
- `googleId` (varchar, unique) - Google's user ID (sub claim)

### `userAuthProviders` table (new):
- `id` (int, primary key)
- `userId` (int) - Reference to users table
- `provider` (enum: 'manus', 'google')
- `providerId` (varchar) - Provider-specific user ID
- `createdAt` (timestamp)

## User Account Linking

When a user signs in with Google:

1. **First time with Google ID**: A new account is created
2. **Existing user with same email**: The Google ID is linked to the existing account
3. **Multiple providers**: Users can have both Manus and Google OAuth linked to the same account

## Security Considerations

1. **Client Secret**: Never expose the Google Client Secret in frontend code
2. **HTTPS Only**: Always use HTTPS in production
3. **State Parameter**: The state parameter is used to prevent CSRF attacks
4. **Token Verification**: ID tokens are verified using Google's public keys
5. **Session Tokens**: FarmKonnect uses JWT session tokens (same as Manus OAuth)

## Troubleshooting

### "Invalid Client ID" Error
- Verify the GOOGLE_CLIENT_ID environment variable is correct
- Check that the client ID is for a Web application, not another type

### "Redirect URI mismatch" Error
- Ensure the redirect URI in Google Cloud Console matches exactly:
  - Protocol (https vs http)
  - Domain
  - Path (/api/oauth/google/callback)

### "Invalid ID Token" Error
- Verify the GOOGLE_CLIENT_ID is correct
- Check that the token hasn't expired
- Ensure the audience claim matches the client ID

### Users Not Being Created
- Check database connection
- Verify `users` and `userAuthProviders` tables exist
- Check server logs for database errors

## Support

For issues or questions:
1. Check the server logs: `.manus-logs/devserver.log`
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Contact Manus support at https://help.manus.im

## Next Steps

1. Set up the Google OAuth credentials in Google Cloud Console
2. Add the environment variables to your FarmKonnect project
3. Test the Google Sign-In flow
4. Monitor user authentication logs
5. Consider adding additional OAuth providers (GitHub, Microsoft, etc.)

---

**Implementation Date**: February 18, 2026
**FarmKonnect Version**: 1.0.0
**Google OAuth Library**: google-auth-library
