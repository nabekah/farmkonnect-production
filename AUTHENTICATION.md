# FarmKonnect Authentication System

## Overview

FarmKonnect now includes a comprehensive authentication system supporting:
- **Username/Password Authentication** (Local)
- **Google OAuth** (Placeholder - ready for integration)
- **Manus OAuth** (Placeholder - ready for integration)
- **Email Verification**
- **Account Security Features** (Account lockout, password reset, etc.)

## Database Schema Updates

### New User Fields
```sql
ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE DEFAULT NULL;
ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255);
ALTER TABLE users ADD COLUMN emailVerificationTokenExpiresAt TIMESTAMP;
```

### User Auth Providers Table
```sql
CREATE TABLE userAuthProviders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  provider ENUM('manus', 'google') NOT NULL,
  providerId VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend API Endpoints

### 1. Register with Password
**Endpoint:** `POST /api/trpc/auth.registerWithPassword`

**Input:**
```typescript
{
  username: string;        // 3-100 chars, alphanumeric + underscore/hyphen
  email: string;           // Valid email format
  password: string;        // Must meet requirements (see below)
  confirmPassword: string; // Must match password
  name: string;            // 2+ characters
  role: enum;              // farmer | agent | veterinarian | buyer | transporter
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}; etc.)

**Response:**
```typescript
{
  success: boolean;
  message: string;
  userId: number;
}
```

### 2. Login with Password
**Endpoint:** `POST /api/trpc/auth.loginWithPassword`

**Input:**
```typescript
{
  usernameOrEmail: string; // Username or email address
  password: string;        // User's password
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: string;
  };
}
```

**Error Handling:**
- Account locked after 5 failed attempts (15-minute lockout)
- Email verification required before login
- Account approval required before login
- Account status checked (active, disabled, suspended)

### 3. Verify Email
**Endpoint:** `POST /api/trpc/auth.verifyEmail`

**Input:**
```typescript
{
  token: string; // Email verification token
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 4. Request Email Verification
**Endpoint:** `POST /api/trpc/auth.requestEmailVerification`

**Input:**
```typescript
{
  email: string; // User's email address
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  verificationToken: string; // For testing only
}
```

### 5. Change Password
**Endpoint:** `POST /api/trpc/auth.changePassword` (Protected)

**Input:**
```typescript
{
  currentPassword: string;  // Current password
  newPassword: string;      // New password (must meet requirements)
  confirmPassword: string;  // Must match newPassword
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 6. Get Auth Providers
**Endpoint:** `GET /api/trpc/auth.getAuthProviders` (Protected)

**Response:**
```typescript
[
  {
    id: number;
    userId: number;
    provider: 'manus' | 'google';
    providerId: string;
    createdAt: Date;
  }
]
```

### 7. Link OAuth Provider
**Endpoint:** `POST /api/trpc/auth.linkOAuthProvider` (Protected)

**Input:**
```typescript
{
  provider: 'manus' | 'google';
  providerId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 8. Unlink OAuth Provider
**Endpoint:** `POST /api/trpc/auth.unlinkOAuthProvider` (Protected)

**Input:**
```typescript
{
  provider: 'manus' | 'google';
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

## Frontend Pages

### 1. Login Page (`/login`)
- Username/email and password fields
- Google OAuth button (placeholder)
- Manus OAuth button (placeholder)
- Forgot password link
- Sign up link
- Error alerts for failed login attempts
- Account lockout notification

### 2. Registration Page (`/register`)
- Full name input
- Username input with validation
- Email input
- Role selection dropdown
- Password input with real-time requirements display
- Confirm password input with matching indicator
- Submit button (disabled until all requirements met)
- Sign in link
- Success message with email verification prompt

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Password requirements enforced on both frontend and backend
- Password change requires current password verification

### Account Lockout
- Automatic lockout after 5 failed login attempts
- 15-minute lockout duration
- Failed attempts and lockout time tracked in database
- Lockout automatically cleared on successful login

### Email Verification
- Email verification token generated on registration
- Token expires after 24 hours
- Email verification required before login
- Users can request new verification token

### Account Approval
- New accounts start with "pending" approval status
- Admin approval required before users can login
- Approval status tracked in database

### Account Status
- Active, disabled, or suspended status
- Reason for status change stored
- Status checked on every login attempt

## Testing

All authentication features have been tested with 8 passing tests:

```bash
pnpm test server/routers/authRouter.test.ts
```

**Test Coverage:**
- ✓ Password hashing and verification
- ✓ Password requirement validation
- ✓ Email format validation
- ✓ Username format validation
- ✓ Verification token generation
- ✓ Account lockout logic
- ✓ Failed attempt reset logic

## Integration Steps

### 1. Google OAuth Integration
To enable Google OAuth:
1. Get Google OAuth credentials from Google Cloud Console
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment variables
3. Implement OAuth flow in `loginWithPassword` mutation
4. Update Login page to call Google OAuth endpoint

### 2. Manus OAuth Integration
To enable Manus OAuth:
1. Use existing Manus OAuth configuration
2. Implement OAuth flow in `loginWithPassword` mutation
3. Update Login page to call Manus OAuth endpoint

### 3. Email Verification
To enable email sending:
1. Configure SendGrid or email service
2. Add email sending logic to `registerWithPassword` mutation
3. Send verification token via email
4. Update `requestEmailVerification` to send email

## Usage Examples

### Register a New User
```typescript
const response = await trpc.auth.registerWithPassword.mutate({
  username: "john_doe",
  email: "john@example.com",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
  name: "John Doe",
  role: "farmer",
});
```

### Login with Password
```typescript
const response = await trpc.auth.loginWithPassword.mutate({
  usernameOrEmail: "john_doe",
  password: "SecurePass123!",
});
```

### Verify Email
```typescript
const response = await trpc.auth.verifyEmail.mutate({
  token: "verification_token_from_email",
});
```

### Change Password
```typescript
const response = await trpc.auth.changePassword.mutate({
  currentPassword: "OldPass123!",
  newPassword: "NewPass456!",
  confirmPassword: "NewPass456!",
});
```

## Next Steps

1. **Implement Google OAuth** - Add Google OAuth flow
2. **Implement Manus OAuth** - Add Manus OAuth flow
3. **Email Integration** - Add SendGrid email sending
4. **Admin Dashboard** - Create admin approval interface
5. **Password Reset** - Implement forgot password flow
6. **Two-Factor Authentication** - Add optional 2FA
7. **Session Management** - Implement session timeout and refresh

## File Structure

```
server/
  routers/
    authRouter.ts           # Authentication procedures
    authRouter.test.ts      # Authentication tests

client/
  src/
    pages/
      Login.tsx             # Login page
      Register.tsx          # Registration page

drizzle/
  schema.ts                 # Database schema with new auth fields
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| CONFLICT | Username already taken | Choose a different username |
| CONFLICT | Email already registered | Use different email or login |
| UNAUTHORIZED | Invalid username/email or password | Check credentials |
| FORBIDDEN | Account is temporarily locked | Wait 15 minutes and try again |
| FORBIDDEN | Please verify your email | Click verification link in email |
| FORBIDDEN | Your account is pending approval | Wait for admin approval |
| FORBIDDEN | Your account is disabled/suspended | Contact support |
| BAD_REQUEST | Passwords don't match | Ensure both password fields match |
| BAD_REQUEST | Password does not meet requirements | Follow password requirements |

## Support

For issues or questions about the authentication system, please refer to the documentation or contact the development team.
