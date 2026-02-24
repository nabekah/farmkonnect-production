# FarmKonnect End-to-End Testing Guide

## Complete User Flow Testing

This guide provides step-by-step instructions for testing the complete authentication and user flow in FarmKonnect.

---

## Test Scenario 1: New User Registration & Login

### Step 1: Register New Account

1. **Navigate to Registration Page**
   - Go to `http://localhost:3000/register`
   - You should see the FarmKonnect registration form

2. **Fill Registration Form**
   - **Email**: `testuser@example.com`
   - **Username**: `testuser`
   - **Password**: `TestPass@123`
   - **Confirm Password**: `TestPass@123`
   - **Full Name**: `Test User`
   - **Phone** (optional): `+1234567890`

3. **Submit Registration**
   - Click "Create Account" button
   - Expected: Success message and redirect to email verification page

4. **Verify Email**
   - Check email inbox for verification link
   - Click the verification link in email
   - Expected: Email verified confirmation

### Step 2: Login with New Account

1. **Navigate to Login Page**
   - Go to `http://localhost:3000/login`

2. **Enter Credentials**
   - **Username or Email**: `testuser@example.com` (or `testuser`)
   - **Password**: `TestPass@123`

3. **Submit Login**
   - Click "Sign In" button
   - Expected: Redirect to Welcome page at `/welcome`

### Step 3: Verify Welcome Page

1. **Check Welcome Page Content**
   - Should display greeting: "Good [morning/afternoon/evening], Test User!"
   - Should show account status: "Active"
   - Should show role badge: "👨‍🌾 Farmer"

2. **Verify Quick Actions Available**
   - Manage Farms
   - Track Crops
   - Livestock Management
   - Weather Alerts
   - Analytics
   - Marketplace

3. **Check Navigation**
   - "Change Password" button in top-right
   - "Logout" button in top-right

### Step 4: Change Password

1. **Click Change Password Button**
   - Click "Change Password" in top-right
   - Should navigate to `/change-password`

2. **Fill Password Change Form**
   - **Current Password**: `TestPass@123`
   - **New Password**: `NewPass@456`
   - **Confirm New Password**: `NewPass@456`

3. **Verify Password Requirements**
   - At least 8 characters ✓
   - One uppercase letter ✓
   - One lowercase letter ✓
   - One number ✓
   - One special character ✓

4. **Submit Password Change**
   - Click "Change Password" button
   - Expected: Success message and redirect to Welcome page

5. **Verify New Password Works**
   - Click Logout
   - Go to `/login`
   - Login with new password: `NewPass@456`
   - Expected: Successful login to Welcome page

---

## Test Scenario 2: Admin Account Login

### Step 1: Admin Login

1. **Navigate to Login Page**
   - Go to `http://localhost:3000/login`

2. **Enter Admin Credentials**
   - **Username or Email**: `admin@farmkonnect.com`
   - **Password**: `Admin@12345`

3. **Submit Login**
   - Click "Sign In" button
   - Expected: Redirect to Welcome page

### Step 2: Verify Admin Welcome Page

1. **Check Admin Badge**
   - Should display: "👑 Administrator"

2. **Verify Admin Quick Actions**
   - All farmer quick actions should be present
   - Additional admin-only sections should appear:
     - **Administration** section with:
       - User Approvals
       - Backup Management

3. **Access Admin Approvals**
   - Click "User Approvals" card
   - Should navigate to `/admin/approvals`
   - Should display pending user registrations

4. **Access Backup Management**
   - Click "Backup Management" card
   - Should navigate to `/admin/backups`
   - Should display backup statistics and history

### Step 3: Change Admin Password

1. **Click Change Password**
   - Click "Change Password" button
   - Navigate to `/change-password`

2. **Change Admin Password**
   - **Current Password**: `Admin@12345`
   - **New Password**: `AdminNew@789`
   - **Confirm New Password**: `AdminNew@789`

3. **Verify Admin Can Login with New Password**
   - Logout
   - Login with new password
   - Expected: Successful login

---

## Test Scenario 3: Navigation Menu & Dashboard Access

### Step 1: Access Quick Actions

1. **From Welcome Page**
   - Click "Manage Farms" card
   - Expected: Navigate to `/farms` with DashboardLayout

2. **Click Each Quick Action**
   - Manage Farms → `/farms`
   - Track Crops → `/crops`
   - Livestock Management → `/livestock`
   - Weather Alerts → `/weather`
   - Analytics → `/analytics`
   - Marketplace → `/marketplace`

### Step 2: Verify DashboardLayout

1. **Check Sidebar Navigation**
   - Should display all available modules
   - Current page should be highlighted
   - Should have dark mode toggle

2. **Check Top Navigation**
   - FarmKonnect logo
   - Breadcrumb navigation
   - User profile menu
   - Notification center

3. **Verify Responsive Design**
   - Test on mobile viewport (375px)
   - Test on tablet viewport (768px)
   - Test on desktop viewport (1920px)
   - Sidebar should collapse on mobile

---

## Test Scenario 4: Session Management

### Step 1: Session Persistence

1. **Login to Account**
   - Navigate to `/login`
   - Login with credentials
   - Navigate to `/welcome`

2. **Refresh Page**
   - Press F5 or Cmd+R
   - Expected: Still logged in, page refreshes without logout

3. **Navigate Away and Back**
   - Click on different pages
   - Navigate back to `/welcome`
   - Expected: Session maintained

### Step 2: Logout Functionality

1. **Click Logout Button**
   - From Welcome page, click "Logout"
   - Expected: Redirect to `/login`

2. **Verify Session Cleared**
   - Try to access `/welcome` directly
   - Expected: Redirect to `/login`

3. **Verify Cookie Cleared**
   - Open browser DevTools (F12)
   - Go to Application → Cookies
   - Expected: Session cookie removed

---

## Test Scenario 5: Error Handling

### Step 1: Invalid Login Credentials

1. **Try Wrong Password**
   - Email: `testuser@example.com`
   - Password: `WrongPassword123`
   - Expected: Error message "Invalid credentials"

2. **Try Non-existent Email**
   - Email: `nonexistent@example.com`
   - Password: `AnyPassword@123`
   - Expected: Error message "User not found"

3. **Try Empty Fields**
   - Leave email/username empty
   - Click "Sign In"
   - Expected: Validation error "Email or username is required"

### Step 2: Password Change Errors

1. **Try Weak Password**
   - New Password: `weak`
   - Expected: Error "Password must be at least 8 characters"

2. **Try Mismatched Passwords**
   - New Password: `StrongPass@123`
   - Confirm Password: `DifferentPass@123`
   - Expected: Error "Passwords do not match"

3. **Try Same as Current**
   - Current Password: `TestPass@123`
   - New Password: `TestPass@123`
   - Expected: Error "New password must be different"

### Step 3: Account Lockout

1. **Try Multiple Wrong Passwords**
   - Enter wrong password 5 times
   - Expected: Account locked for 15 minutes
   - Error message: "Account locked. Try again later."

2. **Wait for Unlock**
   - Wait 15 minutes (or check database)
   - Try login again
   - Expected: Account unlocked, can login

---

## Test Scenario 6: Email Verification

### Step 1: Unverified Email Login

1. **Register New Account** (without verifying email)
   - Go through registration
   - Don't click email verification link

2. **Try to Login**
   - Expected: May show warning about unverified email
   - Should still allow login (depending on settings)

3. **Verify Email Later**
   - Click "Resend Verification Email"
   - Check email inbox
   - Click verification link
   - Expected: Email verified message

---

## Test Scenario 7: Admin Functions

### Step 1: User Approval Dashboard

1. **Login as Admin**
   - Use admin credentials
   - Navigate to `/admin/approvals`

2. **View Pending Approvals**
   - Should display list of pending users
   - Should show user details (email, name, registration date)

3. **Approve User**
   - Click "Approve" button
   - Expected: User status changes to approved

4. **Reject User**
   - Click "Reject" button
   - Expected: User status changes to rejected

### Step 2: Backup Management Dashboard

1. **Navigate to Backup Dashboard**
   - From Welcome page, click "Backup Management"
   - Navigate to `/admin/backups`

2. **View Backup Statistics**
   - Total Backups count
   - Last Backup date/time
   - System Status (Active)

3. **Create Manual Backup**
   - Click "Create Backup" button
   - Expected: Loading state, then success message
   - New backup appears in history

4. **Restore from Backup**
   - Click "Restore" on a backup
   - Confirm restoration
   - Expected: Success message, database restored

5. **Delete Backup**
   - Click "Delete" on a backup
   - Confirm deletion
   - Expected: Backup removed from list

---

## Test Scenario 8: Google OAuth Login (Optional)

### Step 1: Google Login

1. **Navigate to Login Page**
   - Go to `/login`

2. **Click Google Login Button**
   - Click "Sign in with Google"
   - Expected: Redirect to Google OAuth consent screen

3. **Authorize Application**
   - Select Google account
   - Click "Allow" to authorize
   - Expected: Redirect back to Welcome page

4. **Verify Account Created**
   - Should be logged in
   - Should see Welcome page
   - Account linked to Google

---

## Automated Testing Checklist

### Authentication Tests
- [ ] User registration with valid data
- [ ] User registration with invalid email
- [ ] User registration with weak password
- [ ] User registration with duplicate email
- [ ] Email verification flow
- [ ] Login with correct credentials
- [ ] Login with incorrect password
- [ ] Login with non-existent email
- [ ] Account lockout after 5 failed attempts
- [ ] Account unlock after 15 minutes
- [ ] Password change with valid data
- [ ] Password change with weak password
- [ ] Password change with mismatched passwords
- [ ] Session persistence across page refresh
- [ ] Session cleared on logout

### Navigation Tests
- [ ] Welcome page loads after login
- [ ] All quick action cards navigate correctly
- [ ] Sidebar navigation works
- [ ] Breadcrumb navigation works
- [ ] Dark mode toggle works
- [ ] Mobile responsive design

### Admin Tests
- [ ] Admin can access admin dashboard
- [ ] Admin can view pending approvals
- [ ] Admin can approve users
- [ ] Admin can reject users
- [ ] Admin can access backup dashboard
- [ ] Admin can create manual backups
- [ ] Admin can restore backups
- [ ] Admin can delete backups

### Error Handling Tests
- [ ] Invalid login shows error
- [ ] Weak password shows error
- [ ] Mismatched passwords show error
- [ ] Account lockout shows error
- [ ] Network error handling
- [ ] Database error handling

---

## Performance Testing

### Page Load Times
- Login page: < 2s
- Welcome page: < 2s
- Change password page: < 1s
- Admin dashboard: < 3s

### API Response Times
- Login: < 500ms
- Password change: < 500ms
- User approval: < 500ms
- Backup operations: < 1000ms

---

## Browser Compatibility Testing

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

---

## Security Testing

- [ ] Passwords not visible in source code
- [ ] Session tokens not exposed in logs
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] SQL injection prevention
- [ ] Rate limiting on login attempts
- [ ] Secure password hashing (bcrypt)

---

## Test Data

### Test Accounts

**Regular User:**
- Email: `testuser@example.com`
- Username: `testuser`
- Password: `TestPass@123`
- Role: Farmer

**Admin Account:**
- Email: `admin@farmkonnect.com`
- Username: `admin`
- Password: `Admin@12345`
- Role: Admin

**Additional Test Users:**
- Email: `farmer1@example.com` - Password: `Farmer1@Pass`
- Email: `farmer2@example.com` - Password: `Farmer2@Pass`
- Email: `manager@example.com` - Password: `Manager@Pass`

---

## Troubleshooting

### Common Issues

**Issue: Login fails with "Database connection failed"**
- Solution: Check DATABASE_URL environment variable
- Check database server is running
- Verify database credentials

**Issue: Email verification not working**
- Solution: Check SendGrid API key
- Verify sender email is verified in SendGrid
- Check email logs

**Issue: Password change fails**
- Solution: Verify current password is correct
- Check password meets requirements
- Check database connection

**Issue: Admin dashboard not accessible**
- Solution: Verify user role is 'admin' in database
- Check user is authenticated
- Verify route is registered in App.tsx

---

## Deployment Testing

### Pre-deployment Checklist
- [ ] All tests passing locally
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin account created
- [ ] Email service configured
- [ ] Session secrets configured

### Post-deployment Checklist
- [ ] Login works on production URL
- [ ] Welcome page loads
- [ ] Password change works
- [ ] Admin dashboard accessible
- [ ] Email verification works
- [ ] Session persists
- [ ] Logout works
- [ ] Error pages display correctly

---

## Monitoring & Logging

### Key Metrics to Monitor
- Login success rate
- Login failure rate
- Password change success rate
- Session duration
- Page load times
- API response times
- Error rates

### Logs to Check
- Application logs: `/var/log/farmkonnect/app.log`
- Error logs: `/var/log/farmkonnect/error.log`
- Database logs: Check database server logs
- Email logs: Check SendGrid dashboard

---

## Support & Escalation

**For bugs or issues:**
1. Document the issue with screenshots
2. Note the exact steps to reproduce
3. Check error logs
4. Contact development team

**For performance issues:**
1. Check server resources (CPU, memory, disk)
2. Review database query performance
3. Check network connectivity
4. Review application logs

---

## Sign-off

- [ ] All tests completed
- [ ] All tests passed
- [ ] No critical issues
- [ ] Ready for production

**Tested By:** ________________
**Date:** ________________
**Version:** ________________
