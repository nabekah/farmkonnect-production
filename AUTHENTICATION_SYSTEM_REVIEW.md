# FarmKonnect Authentication System - Complete Review

## Executive Summary

The FarmKonnect authentication system has been completely redesigned to remove Manus OAuth and implement a custom authentication flow using username/password and Google OAuth. All server-side code is correctly configured, but the production domain (www.farmconnekt.com) has Manus OAuth enabled at the Manus platform gateway level, which intercepts requests before they reach our application.

## Authentication Flow Architecture

### 1. Client-Side Flow (Frontend)

```
User visits https://www.farmconnekt.com/
    ↓
Browser loads index.html
    ↓
main.tsx initializes React app
    ↓
App.tsx renders Router component
    ↓
Router checks current path:
    - "/" → Home page (public)
    - "/login" → Login page (public)
    - "/register" → Register page (public)
    - "/forgot-password" → Forgot password page (public)
    - "/reset-password" → Reset password page (public)
    - "/verify-email" → Email verification page (public)
    - Other routes → Protected (requires authentication)
```

### 2. Authentication Methods

#### A. Username/Password Login
1. User enters username/email and password on `/login`
2. Frontend calls `trpc.auth.loginWithPassword` mutation
3. Backend validates credentials:
   - Checks if user exists by username or email
   - Verifies password using bcrypt
   - Checks account status (approved/pending)
   - Checks for account lockout (5 failed attempts = 15 min lockout)
4. On success:
   - Backend creates JWT session token
   - Sets secure HTTP-only cookie named "session"
   - Returns user info to frontend
5. Frontend redirects to dashboard

#### B. Registration Flow
1. User enters details on `/register`:
   - Full name, username, email, password, role selection
2. Frontend validates:
   - Password strength (8+ chars, uppercase, lowercase, number, special char)
   - Password confirmation matching
   - Username format (letters, numbers, underscores, hyphens)
   - Email format
3. Frontend calls `trpc.auth.registerWithPassword` mutation
4. Backend:
   - Checks for duplicate username/email
   - Hashes password using bcrypt
   - Creates user with `approvalStatus: "pending"`
   - Generates email verification token (1 hour expiry)
   - Sends verification email via SendGrid
5. Frontend redirects to email verification page

#### C. Email Verification
1. User receives verification email with token link
2. User clicks link → `/verify-email?token=xxx`
3. Frontend automatically verifies token via `trpc.auth.verifyEmail`
4. Backend:
   - Validates token expiry
   - Marks user as `emailVerified: true`
   - Updates `approvalStatus` if admin approval is enabled
5. Frontend shows success message and redirects to login

#### D. Password Reset Flow
1. User clicks "Forgot Password" on login page
2. User enters email on `/forgot-password`
3. Frontend calls `trpc.passwordReset.requestReset` mutation
4. Backend:
   - Finds user by email
   - Generates reset token (1 hour expiry)
   - Sends reset email via SendGrid
5. User clicks reset link in email → `/reset-password?token=xxx`
6. Frontend displays password reset form
7. User enters new password
8. Frontend calls `trpc.passwordReset.resetPassword` mutation
9. Backend:
   - Validates token
   - Hashes new password
   - Updates user password
10. Frontend redirects to login

#### E. Google OAuth Login
1. User clicks "Sign in with Google" on login page
2. Frontend calls `getGoogleLoginUrl()` to get authorization URL
3. Frontend redirects to Google OAuth authorization endpoint
4. User authorizes FarmKonnect app
5. Google redirects to `/api/oauth/google/callback?code=xxx&state=xxx`
6. Backend:
   - Exchanges code for Google access token
   - Gets user info from Google
   - Upserts user in database (creates if not exists)
   - Creates JWT session token
   - Sets secure HTTP-only cookie
7. Backend redirects to `/dashboard`
8. Frontend loads authenticated dashboard

### 3. Session Management

#### Session Token (JWT)
- Created using HS256 algorithm
- Contains: userId, email, role
- Expiry: 1 year
- Stored in HTTP-only secure cookie named "session"
- Verified on every API request via `sdk.authenticateRequest()`

#### Authentication Context
- `createContext()` in `server/_core/context.ts` runs on every tRPC request
- Extracts session cookie
- Verifies JWT token
- Retrieves user from database
- Makes user available as `ctx.user` in procedures

### 4. Protected Routes & Procedures

#### Public Routes (No Authentication Required)
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation
- `/verify-email` - Email verification
- `/api/oauth/google/callback` - OAuth callback

#### Protected Routes (Authentication Required)
- `/dashboard` - Main dashboard
- `/farm-management` - Farm management
- `/analytics` - Analytics dashboard
- All other routes

#### Public Procedures
- `auth.loginWithPassword` - Login with username/password
- `auth.registerWithPassword` - Register new account
- `auth.verifyEmail` - Verify email address
- `passwordReset.requestReset` - Request password reset
- `passwordReset.resetPassword` - Reset password with token

#### Protected Procedures
- `auth.me` - Get current user info
- `auth.logout` - Logout user
- `auth.changePassword` - Change password
- All dashboard procedures
- All data management procedures

### 5. Error Handling

#### Unauthorized Errors
- When API returns "Unauthorized" error
- Client checks current path
- If path is public route → error is displayed to user
- If path is protected route → redirect to `/login`

#### Account Lockout
- After 5 failed login attempts
- Account locked for 15 minutes
- User cannot login during lockout period
- Error message: "Account locked. Try again later."

#### Expired Tokens
- Email verification tokens expire after 1 hour
- Password reset tokens expire after 1 hour
- User can request new token via "Resend" button

## Production Domain Issue

### Problem
The production domain (www.farmconnekt.com) shows Manus OAuth login page instead of our custom authentication UI.

### Root Cause
The Manus platform gateway is enforcing OAuth at the domain level. When a user visits www.farmconnekt.com, the Manus gateway intercepts the request and redirects to Manus OAuth login page BEFORE the request reaches our Express server.

### Evidence
1. Dev server (localhost:3000) works correctly with custom authentication
2. Server code has NO Manus OAuth middleware
3. Client code redirects to `/login` (custom page), not Manus OAuth
4. OAuth interception happens at platform gateway level

### Solutions

#### Option 1: Disable Manus OAuth at Platform Level (Recommended)
1. Go to Manus Management UI → Settings → Security
2. Disable "Enforce OAuth" or "OAuth Gateway"
3. This allows requests to reach our Express server
4. Our custom authentication will work

#### Option 2: Use Custom Domain Without Manus OAuth
1. Purchase custom domain (e.g., farmkonnect.io)
2. Configure DNS to point to Manus platform
3. Request Manus support to disable OAuth for this domain
4. Deploy application with custom domain

#### Option 3: Use Dev Server URL for Testing
1. Use the dev server URL: https://3000-ibtqeyq8u5fze6mn0bikt-087be784.us2.manus.computer
2. This URL bypasses Manus OAuth gateway
3. Custom authentication works perfectly
4. Use for testing and development

## Code Structure

### Server Files
```
server/
├── _core/
│   ├── index.ts - Express app setup
│   ├── context.ts - tRPC context with authentication
│   ├── oauth.ts - OAuth routes (Google only)
│   ├── sdk.ts - Session management (JWT-based)
│   ├── googleOAuth.ts - Google OAuth integration
│   ├── cookies.ts - Session cookie configuration
│   └── env.ts - Environment variables
├── routers/
│   ├── authRouter.ts - Authentication procedures
│   ├── passwordReset.ts - Password reset procedures
│   ├── userApprovalRouter.ts - Admin approval procedures
│   └── oauthCallbackRouter.ts - OAuth callback handlers
└── db.ts - Database query helpers
```

### Client Files
```
client/src/
├── pages/
│   ├── Login.tsx - Username/password login
│   ├── Register.tsx - Registration form
│   ├── ForgotPassword.tsx - Password reset request
│   ├── ResetPassword.tsx - Password reset confirmation
│   ├── VerifyEmail.tsx - Email verification
│   ├── EmailVerificationPage.tsx - Email verification UI
│   └── Home.tsx - Landing page
├── lib/
│   └── trpc.ts - tRPC client configuration
├── const.ts - Constants (getLoginUrl, getGoogleLoginUrl)
└── main.tsx - App initialization
```

## Testing Checklist

- [ ] Dev server loads without Manus OAuth
- [ ] Registration form works and creates user
- [ ] Email verification token is generated
- [ ] Login with username/password works
- [ ] Login with Google OAuth works
- [ ] Password reset flow works
- [ ] Account lockout after 5 failed attempts
- [ ] Protected routes redirect to login when not authenticated
- [ ] Admin approval dashboard shows pending users
- [ ] Admin can approve/reject users
- [ ] Approved users can login

## Next Steps

1. **Disable Manus OAuth at Platform Level** - Contact Manus support or use Management UI to disable OAuth gateway
2. **Test Production Domain** - Verify custom authentication works on www.farmconnekt.com
3. **Monitor Authentication Logs** - Check `authAnalyticsLogger` for login attempts and failures
4. **Implement 2FA** - Add TOTP-based 2FA for enhanced security
5. **Create User Profile Dashboard** - Allow users to manage profile and settings
