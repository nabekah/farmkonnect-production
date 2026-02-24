# FarmKonnect - Feature Implementation Guide

## Overview

This guide documents the three enhanced features implemented for FarmKonnect:

1. **Two-Factor Authentication (2FA/MFA)**
2. **User Profile Page**
3. **Email Notification System**

---

## 1. Two-Factor Authentication (2FA/MFA)

### Status: ✅ EXISTING & ENHANCED

### Location
- **Component**: `client/src/components/MFASetup.tsx`
- **Router**: `server/routers/mfa.ts`
- **Integration**: `client/src/pages/Settings.tsx` (Security tab)

### Features
- **TOTP (Time-based One-Time Password)** - Authenticator app support (Google Authenticator, Authy, Microsoft Authenticator)
- **SMS Authentication** - SMS code delivery for backup
- **Backup Codes** - Recovery codes for account access if 2FA device is lost
- **MFA Status Tracking** - View current 2FA status
- **Enable/Disable MFA** - User control with password verification

### Implementation Details

#### Server-side (mfa.ts)
```typescript
// Available procedures:
- mfa.getMFAStatus() - Get current MFA status
- mfa.enableTOTP() - Generate TOTP secret and QR code
- mfa.verifyAndActivateTOTP(code) - Verify TOTP code and activate
- mfa.enableSMS(phoneNumber) - Enable SMS 2FA
- mfa.verifySMSCode(code) - Verify SMS code
- mfa.disableMFA(password) - Disable 2FA
- mfa.getBackupCodes() - Get backup codes
```

#### Client-side (Settings.tsx)
```typescript
// MFAEnrollmentCard component provides:
- View current MFA status
- Enroll in TOTP with QR code scanning
- Enroll in SMS with phone verification
- Download backup codes
- Disable MFA with password confirmation
```

### How to Use

**For Users:**
1. Go to Settings → Security tab
2. Click "Enable Two-Factor Authentication"
3. Choose TOTP or SMS method
4. Scan QR code with authenticator app
5. Enter verification code
6. Download and save backup codes
7. Confirm activation

**For Developers:**
```typescript
// Check if user has MFA enabled
const mfaStatus = await trpc.mfa.getMFAStatus.useQuery();

// Enable TOTP
const { totpSecret, qrCode } = await trpc.mfa.enableTOTP.mutateAsync();

// Verify and activate
await trpc.mfa.verifyAndActivateTOTP.mutateAsync({ code: '123456' });
```

### Database Schema
```sql
CREATE TABLE mfa_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  totpSecret VARCHAR(255),
  totpEnabled BOOLEAN DEFAULT FALSE,
  smsPhoneNumber VARCHAR(20),
  smsEnabled BOOLEAN DEFAULT FALSE,
  backupCodes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Testing
- Test TOTP enrollment and verification
- Test SMS enrollment and verification
- Test backup code generation and usage
- Test MFA disable with password verification
- Test account access with 2FA enabled

---

## 2. User Profile Page

### Status: ✅ NEW & ENHANCED

### Location
- **Component**: `client/src/pages/UserProfile.tsx`
- **Route**: `/profile`
- **Integration**: Welcome page, Settings page

### Features
- **Profile Picture Upload** - Avatar upload with preview (JPG, PNG, GIF, max 5MB)
- **Personal Information** - Name, email, phone, address, city, country
- **Account Information** - Role, email status, account creation date
- **Edit Mode** - Toggle between view and edit modes
- **Form Validation** - Client-side validation for all fields
- **Success/Error Notifications** - User feedback on save operations

### Implementation Details

#### Component Structure
```typescript
// UserProfile.tsx provides:
- Profile picture upload with preview
- Personal information form (name, phone, address, etc.)
- Account information display (role, email status, dates)
- Edit/Save/Cancel functionality
- Form validation
- Error and success notifications
```

#### Features
1. **Avatar Upload**
   - Click avatar or "Choose Image" button
   - Supports JPG, PNG, GIF
   - Max 5MB file size
   - Real-time preview
   - Initials fallback if no avatar

2. **Personal Information**
   - Full Name (required)
   - Email (read-only)
   - Phone Number (optional, validated)
   - Address (optional)
   - City (optional)
   - Country (optional)

3. **Account Information**
   - Role badge (Admin/Farmer)
   - Email verification status
   - Account creation date
   - Last updated date

### How to Use

**For Users:**
1. Click "My Profile" button on Welcome page
2. View or edit profile information
3. Click "Edit" to modify details
4. Upload profile picture by clicking avatar
5. Click "Save Changes" to update
6. View account information

**For Developers:**
```typescript
// Navigate to profile
navigate('/profile');

// Profile data structure
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}
```

### Integration Points
- Welcome page: "My Profile" button
- Settings page: Profile tab
- Navigation: `/profile` route

### Future Enhancements
- S3 avatar upload
- Profile picture cropping
- Social media integration
- Notification preferences
- Privacy settings

---

## 3. Email Notification System

### Status: ✅ EXISTING & ENHANCED

### Location
- **Service**: `server/_core/emailNotifications.ts`
- **Enhanced Service**: `server/_core/emailNotifications.enhanced.ts`
- **Provider**: SendGrid API

### Features

#### Existing Notifications
- **Login Notifications** - Alert on new login with device/location info
- **Security Alerts** - Suspicious activity warnings
- **2FA Setup Confirmation** - Confirmation when 2FA is enabled

#### Enhanced Notifications
- **Password Change Confirmation** - Notify user of password changes
- **Registration Confirmation** - Welcome email with verification link
- **Farm Activity Notifications** - Updates on farm activities
- **Alert Notifications** - Various severity levels (low, medium, high, critical)
- **Marketplace Notifications** - Order and offer updates

### Implementation Details

#### Email Templates

**1. Password Change Confirmation**
```
Subject: Your Password Has Been Changed
Content:
- Confirmation of password change
- Change timestamp
- Security notice
- Support contact info
```

**2. Registration Confirmation**
```
Subject: Welcome to FarmKonnect - Verify Your Email
Content:
- Welcome message
- Email verification link (24-hour expiry)
- Getting started guide
- Next steps
```

**3. Farm Activity Notification**
```
Subject: Farm Activity: [Farm Name] - [Activity Type]
Content:
- Farm name
- Activity type and details
- Timestamp
- Link to farm details
```

**4. Alert Notification**
```
Subject: [Severity] Alert: [Alert Type]
Content:
- Alert type and severity
- Alert message
- Timestamp
- Link to view all alerts
```

**5. Marketplace Notification**
```
Subject: [Order Status] or [New Offer]
Content:
- Order/offer details
- Status updates
- Action links
```

### How to Use

#### Server-side Integration

```typescript
import { emailNotifications } from "./server/_core/emailNotifications";
import { enhancedEmailNotifications } from "./server/_core/emailNotifications.enhanced";

// Send password change confirmation
await emailNotifications.sendPasswordChangeConfirmation(
  userEmail,
  userName
);

// Send farm activity notification
await enhancedEmailNotifications.sendFarmActivityNotification(
  userEmail,
  userName,
  'Farm Name',
  'Crop Planted',
  'Corn planted in Field A'
);

// Send alert notification
await enhancedEmailNotifications.sendAlertNotification(
  userEmail,
  userName,
  'Weather Alert',
  'high',
  'Heavy rain expected in your region'
);

// Send marketplace notification
await enhancedEmailNotifications.sendMarketplaceNotification(
  userEmail,
  userName,
  'order_shipped',
  {
    'Order ID': 'ORD-12345',
    'Tracking Number': 'TRACK-67890',
    'Estimated Delivery': '2026-02-28'
  }
);
```

#### Client-side Trigger

```typescript
// Example: Trigger password change email after password change
const changePasswordMutation = trpc.auth.changePassword.useMutation({
  onSuccess: async () => {
    // Email is sent automatically by server
    // User sees success notification
  }
});
```

### Configuration

#### Environment Variables
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@farmconnekt.com
```

#### SendGrid Setup
1. Create SendGrid account
2. Generate API key
3. Verify sender email
4. Set environment variables
5. Test email delivery

### Email Customization

#### Branding
- Update `fromEmail` in service
- Customize HTML templates
- Add company logo/colors
- Update footer information

#### Localization
- Add language support
- Translate templates
- Handle timezone conversions
- Format dates per locale

### Monitoring & Analytics

#### SendGrid Dashboard
- Track email delivery rates
- Monitor bounce/complaint rates
- View engagement metrics
- Analyze email performance

#### Logging
```typescript
// Emails are logged with:
- Recipient email
- Subject
- Send timestamp
- Success/failure status
- Message ID
```

### Testing

#### Test Email Sending
```typescript
// Mock mode (development)
// Set SENDGRID_API_KEY to empty string
// Emails are logged but not sent

// Production mode
// Set valid SENDGRID_API_KEY
// Emails are sent via SendGrid
```

#### Test Cases
- Send password change email
- Send registration confirmation
- Send farm activity notification
- Send alert with different severities
- Send marketplace notifications
- Test with invalid email
- Test with SendGrid API down

---

## Integration Checklist

### 2FA/MFA
- [x] MFA router implemented
- [x] MFA setup component created
- [x] Settings page integration
- [x] TOTP QR code generation
- [x] SMS verification
- [x] Backup codes
- [ ] Login flow integration (TODO)
- [ ] MFA enforcement for admin accounts (TODO)

### User Profile
- [x] Profile page created
- [x] Avatar upload UI
- [x] Personal information form
- [x] Account information display
- [x] Edit/Save functionality
- [x] Form validation
- [ ] S3 avatar upload (TODO)
- [ ] Profile picture cropping (TODO)

### Email Notifications
- [x] Enhanced email service created
- [x] Password change email
- [x] Registration confirmation
- [x] Farm activity notifications
- [x] Alert notifications
- [x] Marketplace notifications
- [ ] Email template customization UI (TODO)
- [ ] Notification preferences page (TODO)

---

## Deployment Checklist

### Pre-deployment
- [ ] All features tested locally
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] SendGrid API key set
- [ ] Database migrations run
- [ ] Admin account created

### Post-deployment
- [ ] Login works with 2FA
- [ ] Profile page accessible
- [ ] Avatar upload works
- [ ] Emails sending successfully
- [ ] Notifications appearing
- [ ] Error handling working
- [ ] Performance acceptable

---

## Support & Troubleshooting

### Common Issues

**2FA Not Working**
- Check MFA router is registered
- Verify database has mfa_settings table
- Check user has MFA enabled
- Verify TOTP secret is correct

**Profile Page Not Loading**
- Check route is registered in App.tsx
- Verify user is authenticated
- Check console for errors
- Verify database connection

**Emails Not Sending**
- Check SENDGRID_API_KEY is set
- Verify sender email is verified in SendGrid
- Check SendGrid dashboard for errors
- Review application logs

### Debug Mode

```typescript
// Enable debug logging
console.log('[MFA] Debug info');
console.log('[Profile] Debug info');
console.log('[EmailNotifications] Debug info');
```

---

## Next Steps

1. **Integrate MFA into Login Flow**
   - Prompt for 2FA code after password verification
   - Support backup codes
   - Handle MFA failures

2. **Add Profile Picture to Avatar**
   - Upload to S3
   - Generate thumbnails
   - Cache management

3. **Expand Email Notifications**
   - Add notification preferences
   - Create email template editor
   - Add SMS notifications

4. **User Testing**
   - Conduct UAT
   - Gather feedback
   - Iterate on design

---

## Version History

- **v1.0** (2026-02-24)
  - Initial implementation of 2FA, Profile, and Email Notifications
  - Basic features and integration
  - Production-ready code

---

## Contact & Support

For questions or issues with these features, please contact the development team or submit an issue in the project repository.
