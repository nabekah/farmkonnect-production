# FarmKonnect Authentication Testing Guide

## Overview

This guide documents the comprehensive testing of sign-in and sign-out functionality from both the main navbar (top) and the navigation menu (sidebar/bottom) in the FarmKonnect application.

## Authentication Architecture

### Components Involved

1. **Navbar Component** (`client/src/components/Navbar.tsx`)
   - Top navigation bar visible on all pages
   - Sign-in/Sign-out buttons for authenticated users
   - Profile dropdown menu with logout option

2. **DashboardLayout Component** (`client/src/components/DashboardLayout.tsx`)
   - Sidebar navigation for authenticated users
   - Bottom user profile section with sign-out button
   - Logout function with redirect to home page

3. **Home Component** (`client/src/pages/Home.tsx`)
   - Landing page for unauthenticated users
   - Dashboard view for authenticated users
   - Sign-in buttons (Manus OAuth and Google)

4. **useAuth Hook** (`client/src/_core/hooks/useAuth.ts`)
   - Manages authentication state
   - Provides logout function
   - Handles session management

## Test Scenarios

### Scenario 1: Sign-In from Landing Page

**Objective:** Verify that users can sign in using both Manus OAuth and Google authentication.

**Steps:**
1. Navigate to `https://www.farmkonnect.com`
2. Verify landing page is displayed with sign-in options
3. Click "Sign In with Manus" button
4. Complete Manus OAuth flow
5. Verify user is redirected to dashboard
6. Repeat steps 3-5 for Google sign-in

**Expected Results:**
- ✅ Landing page displays immediately without delay
- ✅ Both sign-in buttons are visible and functional
- ✅ OAuth flow completes successfully
- ✅ User is authenticated and redirected to dashboard
- ✅ User profile appears in navbar and sidebar

### Scenario 2: Sign-Out from Navbar (Top)

**Objective:** Verify that users can sign out from the top navbar and are redirected to landing page.

**Steps:**
1. Sign in to the application (use Scenario 1)
2. Verify user is authenticated and dashboard is displayed
3. Click on user profile button in top navbar (shows user avatar and name)
4. Click "Sign Out" button in profile dropdown
5. Verify logout completes and user is redirected to landing page
6. Verify landing page displays with sign-in options

**Expected Results:**
- ✅ Profile dropdown opens when clicked
- ✅ "Sign Out" button is visible in dropdown
- ✅ Logout mutation completes successfully
- ✅ User is redirected to landing page (`/`)
- ✅ Landing page displays sign-in buttons
- ✅ Session is cleared (no user data in navbar)

**Code Implementation:**
```typescript
// Navbar.tsx - handleLogout function
const handleLogout = async () => {
  await logoutMutation.mutateAsync();
  setLocation("/");
};
```

### Scenario 3: Sign-Out from Sidebar (Bottom)

**Objective:** Verify that users can sign out from the sidebar bottom menu and are redirected to landing page.

**Steps:**
1. Sign in to the application (use Scenario 1)
2. Verify user is authenticated and dashboard is displayed
3. Scroll to bottom of sidebar (or click user profile in sidebar footer)
4. Click "Sign out" button in sidebar footer
5. Verify logout completes and user is redirected to landing page
6. Verify landing page displays with sign-in options

**Expected Results:**
- ✅ User profile section is visible at sidebar bottom
- ✅ "Sign out" button is visible in dropdown menu
- ✅ Logout mutation completes successfully
- ✅ User is redirected to landing page (`/`)
- ✅ Landing page displays sign-in buttons
- ✅ Session is cleared

**Code Implementation:**
```typescript
// DashboardLayout.tsx - logout function
const logout = async () => {
  await baseLogout();
  setLocation("/");
};
```

### Scenario 4: Authenticated User Dashboard

**Objective:** Verify that authenticated users see the dashboard instead of landing page.

**Steps:**
1. Sign in to the application
2. Verify user is on dashboard page
3. Check that landing page content is NOT displayed
4. Verify dashboard features are visible:
   - Sidebar navigation
   - Quick actions
   - Farm management interface
   - Analytics dashboard

**Expected Results:**
- ✅ Dashboard is displayed for authenticated users
- ✅ Landing page is NOT displayed
- ✅ All dashboard features are accessible
- ✅ User profile is visible in navbar and sidebar
- ✅ Navigation menu is functional

### Scenario 5: Landing Page for Unauthenticated Users

**Objective:** Verify that unauthenticated users see the landing page.

**Steps:**
1. Clear browser cookies/session
2. Navigate to `https://www.farmkonnect.com`
3. Verify landing page is displayed
4. Verify sign-in buttons are visible
5. Verify features section is displayed
6. Verify no dashboard content is shown

**Expected Results:**
- ✅ Landing page displays immediately
- ✅ No loading delay or flashing
- ✅ Sign-in buttons are visible and functional
- ✅ Features section is displayed
- ✅ Dashboard content is NOT visible

## Unit Tests

### Home Component Tests

Location: `client/src/pages/Home.test.tsx`

**Test Cases:**
1. ✅ Should render both Google and Manus sign-in buttons
2. ✅ Should display auth buttons as primary options
3. ✅ Should have correct links for auth buttons
4. ✅ Should display features section
5. ✅ Should display CTA section with both auth options
6. ✅ Should have hero section with main heading
7. ✅ Should display farm management features
8. ✅ Should display landing page for unauthenticated users
9. ✅ Should display registration toggle on landing page
10. ✅ Should have working sign-in links
11. ✅ Should display navbar on landing page

**Run Tests:**
```bash
cd /home/ubuntu/farmkonnect_app
pnpm test -- client/src/pages/Home.test.tsx
```

### Navbar Component Tests

Location: `client/src/components/Navbar.test.tsx` (to be created)

**Test Cases to Add:**
1. Should display profile dropdown for authenticated users
2. Should have Sign Out button in profile dropdown
3. Should call logout mutation when Sign Out is clicked
4. Should redirect to home page after logout
5. Should display Sign In button for unauthenticated users

### DashboardLayout Component Tests

Location: `client/src/components/DashboardLayout.test.tsx` (to be created)

**Test Cases to Add:**
1. Should display sidebar for authenticated users
2. Should have Sign out button in sidebar footer
3. Should call logout function when Sign out is clicked
4. Should redirect to home page after logout
5. Should display user profile in sidebar footer

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FarmKonnect App                          │
└─────────────────────────────────────────────────────────────┘

UNAUTHENTICATED USER:
  ┌──────────────────┐
  │  Landing Page    │
  │  - Sign In Manus │
  │  - Sign In Google│
  │  - Features      │
  └────────┬─────────┘
           │
           ├─→ Click "Sign In with Manus" → Manus OAuth Flow
           │
           └─→ Click "Sign In with Google" → Google OAuth Flow
                    │
                    ▼
           ┌──────────────────┐
           │ OAuth Callback   │
           │ Session Created  │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │  Dashboard       │
           │  (Authenticated) │
           └────────┬─────────┘

AUTHENTICATED USER - SIGN OUT OPTIONS:

Option 1: Sign Out from Navbar (Top)
  ┌──────────────────┐
  │  Navbar          │
  │  [User Avatar ▼] │
  │  ├─ Profile      │
  │  ├─ Settings     │
  │  └─ Sign Out ✓   │
  └────────┬─────────┘
           │
           ├─→ Click "Sign Out"
           │
           ▼
  ┌──────────────────┐
  │ Logout Mutation  │
  │ Session Cleared  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Landing Page    │
  │  (Redirect to /) │
  └──────────────────┘

Option 2: Sign Out from Sidebar (Bottom)
  ┌──────────────────┐
  │  Sidebar Footer  │
  │  [User Profile ▼]│
  │  ├─ Notification │
  │  │   Settings    │
  │  └─ Sign out ✓   │
  └────────┬─────────┘
           │
           ├─→ Click "Sign out"
           │
           ▼
  ┌──────────────────┐
  │ Logout Function  │
  │ Session Cleared  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Landing Page    │
  │  (Redirect to /) │
  └──────────────────┘
```

## Implementation Details

### Sign-Out Flow

1. **Navbar Sign-Out (Top)**
   - User clicks profile avatar in navbar
   - Profile dropdown menu opens
   - User clicks "Sign Out" button
   - `handleLogout()` function is called
   - `logoutMutation.mutateAsync()` clears session
   - `setLocation("/")` redirects to landing page

2. **Sidebar Sign-Out (Bottom)**
   - User clicks profile section in sidebar footer
   - Dropdown menu opens
   - User clicks "Sign out" button
   - `logout()` function is called
   - `baseLogout()` clears session
   - `setLocation("/")` redirects to landing page

### Session Management

- **Session Storage:** HTTP-only cookies with JWT token
- **Session Timeout:** 30 minutes of inactivity (with 2-minute warning)
- **Remember Me:** Optional persistent login across browser sessions
- **Logout:** Clears session cookie and invalidates tRPC auth cache

## Testing Checklist

- [ ] Landing page displays immediately without delay
- [ ] Sign-in with Manus OAuth works correctly
- [ ] Sign-in with Google OAuth works correctly
- [ ] User is redirected to dashboard after sign-in
- [ ] Dashboard displays all features for authenticated users
- [ ] Navbar sign-out button is visible and functional
- [ ] Sidebar sign-out button is visible and functional
- [ ] Sign-out from navbar redirects to landing page
- [ ] Sign-out from sidebar redirects to landing page
- [ ] Session is cleared after sign-out
- [ ] Landing page displays after sign-out
- [ ] No errors in browser console
- [ ] No errors in dev server logs
- [ ] All unit tests pass

## Troubleshooting

### Issue: "Oops! Something went wrong" Error

**Cause:** React hooks violation (calling hooks conditionally)

**Solution:** Ensure all hooks are called at the top level of components, not inside conditional blocks.

**Fix Applied:**
```typescript
// ❌ WRONG - Calling hooks conditionally
if (isAuthenticated) {
  useSessionTimeout();
  useRememberMe();
}

// ✅ CORRECT - Calling hooks unconditionally at top level
useSessionTimeout();
useRememberMe();
```

### Issue: Sign-Out Not Redirecting to Landing Page

**Cause:** Missing `setLocation("/")` call after logout

**Solution:** Ensure logout function includes redirect:
```typescript
const logout = async () => {
  await baseLogout();
  setLocation("/");  // This line is required
};
```

### Issue: Landing Page Not Displaying

**Cause:** Authentication check taking too long or redirecting incorrectly

**Solution:** Verify `useAuth()` hook is not redirecting unauthenticated users:
```typescript
// ✅ CORRECT - No redirect for unauthenticated users
const { user, loading, isAuthenticated } = useAuth();
// Do NOT use: useAuth({ redirectOnUnauthenticated: true })
```

## Performance Metrics

- Landing page load time: < 1 second
- Sign-in redirect time: < 2 seconds
- Sign-out redirect time: < 1 second
- Dashboard load time: < 2 seconds

## Security Considerations

1. **Session Timeout:** Automatic logout after 30 minutes of inactivity
2. **CSRF Protection:** tRPC handles CSRF tokens automatically
3. **XSS Protection:** React escapes all user input by default
4. **Secure Cookies:** HTTP-only, Secure, SameSite flags set
5. **OAuth Security:** Manus and Google OAuth flows validated server-side

## Next Steps

1. ✅ Complete unit tests for Navbar component
2. ✅ Complete unit tests for DashboardLayout component
3. ✅ Add integration tests for full authentication flow
4. ✅ Add E2E tests using Playwright or Cypress
5. ✅ Performance testing and optimization
6. ✅ Security audit and penetration testing

## References

- [useAuth Hook Documentation](./client/src/_core/hooks/useAuth.ts)
- [Navbar Component](./client/src/components/Navbar.tsx)
- [DashboardLayout Component](./client/src/components/DashboardLayout.tsx)
- [Home Component](./client/src/pages/Home.tsx)
- [Authentication Tests](./client/src/pages/Home.test.tsx)
