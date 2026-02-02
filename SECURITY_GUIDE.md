# FarmKonnect Security System Guide

Complete guide to the enterprise-grade security system in FarmKonnect, including user registration, approval workflows, role-based access control (RBAC), multi-factor authentication (MFA), and security administration.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Registration & Approval Workflow](#user-registration--approval-workflow)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
5. [Security Administration](#security-administration)
6. [Permission System](#permission-system)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

FarmKonnect implements a comprehensive enterprise security system with the following features:

- **User Registration & Approval**: Public registration with admin approval workflow
- **Advanced RBAC**: Dynamic roles with granular module permissions
- **Multi-Factor Authentication**: TOTP-based 2FA with backup codes
- **Account Management**: Enable/disable/suspend user accounts
- **Security Audit Logging**: Track all security-related events
- **Session Management**: Control active sessions and concurrent logins

---

## User Registration & Approval Workflow

### How New Users Register

1. **Visit Registration Page**: Navigate to `/register` (public access, no login required)

2. **Fill Registration Form**:
   - Full Name (required)
   - Email Address (required)
   - Phone Number (optional)
   - Requested Role: Choose from:
     - **Farmer**: Manage farms, crops, and livestock
     - **Extension Agent**: Provide training and extension services
     - **Veterinarian**: Animal health services
     - **Buyer**: Purchase agricultural products
     - **Transporter**: Manage deliveries and logistics
   - Justification (required, minimum 10 characters): Explain why you want to join

3. **Submit Registration**: Click "Submit Registration"

4. **Wait for Approval**:
   - If approval is required (default): You'll see a "Registration Submitted" message
   - If auto-approval is enabled: You'll see a "Registration Successful" message and can log in immediately

5. **Email Notification**: Once approved, you'll receive an email notification (approval typically takes 1-2 business days)

6. **Log In**: After approval, log in with your credentials via the Manus OAuth system

### Admin Approval Process

1. **Navigate to Security Dashboard**: Go to `/security` (admin access required)

2. **View Pending Requests**: Click the "Approvals" tab
   - Badge shows number of pending requests
   - Each request displays:
     - User's name and email
     - Requested role
     - Phone number
     - Justification
     - Request timestamp

3. **Review Request**: Click "Approve" or "Reject"

4. **Approve Request**:
   - Add optional admin notes
   - Click "Confirm Approval"
   - User account is created automatically
   - User receives email notification

5. **Reject Request**:
   - Provide rejection reason (required, minimum 10 characters)
   - Click "Confirm Rejection"
   - User receives email notification with reason

### Approval Settings

Toggle approval requirements in Security Dashboard → Overview:

- **require_approval_for_new_users = true** (default): All registrations require admin approval
- **require_approval_for_new_users = false**: Users are auto-approved and can log in immediately

---

## Role-Based Access Control (RBAC)

### System Architecture

FarmKonnect uses a **multi-role permission system** where:

1. **Users** can have multiple **roles**
2. **Roles** have **permissions** for specific **modules**
3. **Permissions** are granular: View, Create, Edit, Delete, Export

### Default Roles

The system includes 8 pre-configured roles:

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| **Super Administrator** | Full system access | All modules, all permissions |
| **Farm Manager** | Manage farm operations | Farms, Crops, Livestock, Inventory, Irrigation |
| **Extension Officer** | Training programs | Training, MERL, Notifications |
| **Marketplace Vendor** | Sell products | Marketplace, Orders, Products |
| **Transporter** | Manage deliveries | Transport, Orders |
| **Buyer** | Purchase products | Marketplace, Orders |
| **Veterinarian** | Animal health services | Livestock, Health Records |
| **IoT Technician** | Manage IoT devices | IoT Devices, Sensors, Weather |

### Managing Roles (Admin Only)

#### 1. Create Custom Role

**Location**: Security Dashboard → RBAC tab

**Steps**:
1. Click "Create Role"
2. Enter role name (e.g., "crop_specialist")
3. Enter display name (e.g., "Crop Specialist")
4. Add description (optional)
5. Click "Create"

#### 2. Assign Module Permissions to Role

**Location**: Security Dashboard → RBAC tab

**Steps**:
1. Click on any role in the roles list
2. View modules organized by category:
   - **Agriculture**: Farms, Crops, Livestock, Inventory, Irrigation
   - **Business**: Marketplace, Orders, Payments, Transport
   - **Extension**: Training, MERL
   - **Technology**: IoT, Weather, Notifications
   - **Administration**: Users, Roles, Security, Business Strategy
3. Check permissions for each module:
   - ☑️ **View**: Read-only access
   - ☑️ **Create**: Add new records
   - ☑️ **Edit**: Modify existing records
   - ☑️ **Delete**: Remove records
   - ☑️ **Export**: Download data
4. Click "Save Permissions"

#### 3. Assign Roles to Users

**Location**: Role Management page (`/role-management`)

**Steps**:
1. Select a user from the left panel
2. View their current roles in the right panel
3. Click "Assign Roles"
4. Select one or more roles using checkboxes
5. Click "Assign (N) Role(s)"
6. To remove a role, click the X button next to it

### Permission Inheritance

When a user has **multiple roles**, permissions are **aggregated** (union):

**Example**:
- User has roles: **Farm Manager** + **Marketplace Vendor**
- Farm Manager permissions: Farms (View, Create, Edit), Crops (View, Create)
- Marketplace Vendor permissions: Marketplace (View, Create, Edit, Delete), Orders (View)
- **Final permissions**: User gets ALL permissions from BOTH roles

**Precedence Rule**: If any role grants a permission, the user has that permission.

---

## Multi-Factor Authentication (MFA)

### What is MFA?

Multi-Factor Authentication adds an extra layer of security by requiring two forms of verification:
1. **Something you know**: Your password
2. **Something you have**: Your phone with an authenticator app

### Enabling MFA

**Location**: Settings → Security tab

**Steps**:

1. **Enter Password**:
   - Type your current password
   - Click "Enable MFA"

2. **Scan QR Code**:
   - Open your authenticator app (Google Authenticator, Authy, 1Password, etc.)
   - Scan the QR code displayed
   - Alternatively, manually enter the secret key

3. **Save Backup Codes**:
   - 10 backup codes are generated
   - **Download** or **Copy** them to a secure location
   - These codes can be used if you lose your authenticator device
   - Each code can only be used once

4. **Verify**:
   - Enter the 6-digit code from your authenticator app
   - Click "Verify and Enable MFA"

5. **Success**: MFA is now active. You'll need to enter a code every time you log in.

### Disabling MFA

**Location**: Settings → Security tab

**Steps**:
1. Enter your password
2. Click "Disable MFA"
3. Confirm the action

**Warning**: Disabling MFA makes your account less secure.

### Using Backup Codes

If you lose your authenticator device:
1. At login, enter one of your saved backup codes instead of the 6-digit code
2. Each backup code works only once
3. Contact an admin if you've used all backup codes

---

## Security Administration

### Security Dashboard Overview

**Location**: `/security` (admin access required)

The Security Dashboard has 6 tabs:

#### 1. Overview Tab
- **Pending Approvals**: Number of registration requests awaiting review
- **Active Sessions**: Current logged-in users
- **Security Events**: Recent audit log entries
- **Failed Logins**: Recent failed login attempts

#### 2. Approvals Tab
- View all pending registration requests
- Approve or reject requests with notes
- See request details (name, email, role, justification)

#### 3. Accounts Tab
- List all user accounts
- Enable/disable/suspend accounts
- View account status and approval status
- Filter by status

#### 4. RBAC Tab
- Manage custom roles
- Assign module permissions to roles
- View role hierarchy
- Delete custom roles (system roles cannot be deleted)

#### 5. Audit Logs Tab
- View all security events
- Filter by event type:
  - User Registration
  - User Approved/Rejected
  - Role Assigned/Removed
  - MFA Enabled/Disabled
  - Account Disabled/Enabled
  - Login Success/Failure
  - Session Created/Terminated
  - Permission Changed
  - Security Alert
- Filter by severity: Low, Medium, High, Critical
- Search by user or description

#### 6. Sessions Tab
- View all active sessions
- See user, IP address, device, last activity
- Terminate sessions remotely
- Enforce session timeout settings

### Account Management

#### Disable Account
**Effect**: User cannot log in, all sessions are terminated
**Use case**: Temporary suspension (e.g., policy violation, investigation)
**Steps**:
1. Security Dashboard → Accounts tab
2. Find user
3. Click "Disable"
4. Provide reason
5. Confirm

#### Enable Account
**Effect**: User can log in again
**Steps**:
1. Security Dashboard → Accounts tab
2. Find disabled user
3. Click "Enable"
4. Confirm

#### Suspend Account
**Effect**: Similar to disable, but marked as "suspended" status
**Use case**: Long-term suspension pending review
**Steps**: Same as disable, select "Suspend" option

### Security Settings

**Location**: Security Dashboard → Overview (settings section)

Key settings:
- **session_timeout_minutes**: Auto-logout after inactivity (default: 30)
- **max_failed_login_attempts**: Lock account after N failed logins (default: 5)
- **account_lock_duration_minutes**: How long to lock account (default: 30)
- **require_mfa_for_admin**: Force MFA for admin users (default: true)
- **require_approval_for_new_users**: Require admin approval for registrations (default: true)
- **max_concurrent_sessions**: Max simultaneous logins per user (default: 3)

---

## Permission System

### Module List

FarmKonnect has 18 modules with independent permissions:

| Module | Category | Description |
|--------|----------|-------------|
| farms | Agriculture | Farm Management |
| crops | Agriculture | Crop Management |
| livestock | Agriculture | Livestock Management |
| inventory | Agriculture | Inventory Management |
| irrigation | Agriculture | Irrigation Management |
| marketplace | Business | Marketplace |
| orders | Business | Order Management |
| payments | Business | Payment Management |
| transport | Business | Transport Management |
| training | Extension | Training Programs |
| merl | Extension | MERL System |
| iot | Technology | IoT Devices |
| weather | Technology | Weather Integration |
| notifications | Technology | Notifications |
| users | Administration | User Management |
| roles | Administration | Role Management |
| security | Administration | Security Settings |
| business_strategy | Administration | Business Strategy |

### Permission Types

Each module can have 5 permission types:

1. **View**: Read-only access (list, view details)
2. **Create**: Add new records
3. **Edit**: Modify existing records
4. **Delete**: Remove records
5. **Export**: Download data (CSV, PDF, etc.)

### Checking Permissions (For Developers)

Permissions are automatically checked by the tRPC middleware. To add permission checks to new procedures:

```typescript
// Example: Check if user has "create" permission for "farms" module
protectedProcedure
  .use(async ({ ctx, next }) => {
    const hasPermission = await checkUserPermission(ctx.user.id, "farms", "create");
    if (!hasPermission) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Permission denied" });
    }
    return next({ ctx });
  })
  .mutation(async ({ input, ctx }) => {
    // Create farm logic
  });
```

---

## Troubleshooting

### Common Issues

#### 1. "Email already registered" error
**Cause**: Email is already in the system
**Solution**: Try logging in instead, or contact admin to check account status

#### 2. Registration stuck in "pending" status
**Cause**: Admin hasn't reviewed your request yet
**Solution**: Wait 1-2 business days, or contact admin directly

#### 3. Cannot log in after approval
**Cause**: Account may be disabled or approval not completed
**Solution**: Contact admin to check account status in Security Dashboard

#### 4. Lost MFA device
**Cause**: Phone lost/broken, authenticator app deleted
**Solution**: Use one of your backup codes, or contact admin to disable MFA

#### 5. "Permission denied" errors
**Cause**: Your roles don't have the required permissions
**Solution**: Contact admin to request additional roles or permissions

#### 6. Account locked after failed logins
**Cause**: Too many incorrect password attempts
**Solution**: Wait 30 minutes (default lock duration) or contact admin to unlock

#### 7. Session expired unexpectedly
**Cause**: Session timeout setting or concurrent session limit
**Solution**: Log in again, or contact admin to adjust session settings

### Admin Troubleshooting

#### Reset User MFA
1. Security Dashboard → Accounts tab
2. Find user
3. Click user details
4. Click "Disable MFA" (admin override)
5. User can re-enroll MFA

#### Unlock Account
1. Security Dashboard → Accounts tab
2. Find locked user
3. Click "Enable Account"
4. Failed login counter resets

#### View User Permissions
1. Role Management → Select user
2. View all assigned roles
3. Click each role to see module permissions
4. Check Security Dashboard → Audit Logs for recent permission changes

#### Debug Permission Issues
1. Security Dashboard → RBAC tab
2. Click the role in question
3. Verify module permissions are checked correctly
4. Check if user has the role assigned in Role Management
5. Review Audit Logs for any recent permission changes

---

## Security Best Practices

### For Users
1. **Enable MFA**: Always enable two-factor authentication
2. **Strong Passwords**: Use unique, complex passwords
3. **Save Backup Codes**: Store MFA backup codes in a secure location
4. **Log Out**: Always log out on shared devices
5. **Report Suspicious Activity**: Contact admin if you notice unusual account activity

### For Admins
1. **Review Registrations Promptly**: Check approval requests within 24 hours
2. **Principle of Least Privilege**: Only grant necessary permissions
3. **Regular Audits**: Review audit logs weekly
4. **Monitor Failed Logins**: Investigate repeated failed login attempts
5. **Enforce MFA**: Require MFA for all admin accounts
6. **Session Management**: Set appropriate session timeout values
7. **Document Decisions**: Add notes when approving/rejecting requests or disabling accounts

---

## Support

For security-related questions or issues:
- **Email**: security@farmkonnect.com
- **Admin Dashboard**: `/security`
- **Documentation**: This guide

**Emergency**: If you suspect a security breach, contact admin immediately.

---

*Last Updated: January 31, 2026*
*Version: 1.0*
