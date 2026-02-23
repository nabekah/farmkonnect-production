# FarmKonnect Production Website - Error Analysis & Solutions

## Overview
The production website (https://www.farmconnekt.com) is experiencing multiple errors that prevent proper functionality. These errors are categorized below with root causes and solutions.

---

## Critical Issues

### 1. CORS Policy Blocking manifest.json (CRITICAL)
**Error Message:**
```
Access to fetch at 'https://manus.im/app-auth?...' (redirected from 'https://www.farmconnekt.com/manifest.json') 
from origin 'https://www.farmconnekt.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
- The Manus OAuth platform is intercepting the `/manifest.json` request at the domain level
- The request is being redirected to `https://manus.im/app-auth` which doesn't have CORS headers configured
- This is a platform-level configuration issue, not an application code issue

**Solution:**
1. **Configure Manus Platform Settings:**
   - Go to Manus Management UI → Settings → Domains
   - Add `/manifest.json` to the "Public Routes" or "Unauthenticated Routes" whitelist
   - This will prevent OAuth interception for static manifest file

2. **Alternative: Move manifest.json to a different path:**
   - Rename `manifest.json` to `app.manifest.json`
   - Update `client/index.html` to reference the new path
   - This bypasses the OAuth middleware for this specific file

3. **Add CORS Headers in Express (if applicable):**
   ```typescript
   app.use((req, res, next) => {
     if (req.path === '/manifest.json') {
       res.set('Access-Control-Allow-Origin', '*');
       res.set('Access-Control-Allow-Methods', 'GET');
     }
     next();
   });
   ```

---

### 2. React Error #310 - Invalid Hook Call
**Error Message:**
```
Error: Minified React error #310; visit https://react.dev/errors/310 for the full message
```

**Root Cause:**
- A React hook is being called outside of a functional component
- OR a hook is being called conditionally
- OR hooks are being called in a different order between renders

**Possible Locations:**
- `useNotification()` hook in App.tsx
- `useWebSocket()` hook in App.tsx
- `useZoomKeyboardShortcuts()` hook in App.tsx
- Custom hooks in `client/src/hooks/`

**Solution:**
1. **Verify hook usage in AppContent component:**
   - Ensure all hooks are called at the top level (not inside conditions)
   - Ensure hooks are always called in the same order
   - Ensure hooks are only called in functional components

2. **Check custom hooks:**
   ```typescript
   // ❌ WRONG: Conditional hook call
   if (condition) {
     const data = useQuery(...);
   }
   
   // ✅ CORRECT: Call hook unconditionally
   const data = useQuery(...);
   if (condition) {
     // Use data here
   }
   ```

3. **Debug steps:**
   ```bash
   # Run dev server with full error messages
   NODE_ENV=development pnpm dev
   
   # Check browser console for full error stack
   # Look for the component that's calling the hook incorrectly
   ```

---

### 3. WebSocket Connection Failures
**Error Message:**
```
WebSocket connection to 'wss://www.farmconnekt.com/ws?token=...' failed
[WebSocket] Disconnected: 1006
[WebSocket] WebSocket unavailable, skipping connection attempt
```

**Root Cause:**
- WebSocket server is not properly configured for production
- SSL/TLS certificate issues
- WebSocket endpoint is not properly exposed
- Firewall/proxy blocking WebSocket connections

**Solution:**
1. **Verify WebSocket server is running:**
   ```bash
   # Check if WebSocket server is initialized
   grep -n "initializeWebSocketServer" server/_core/index.ts
   ```

2. **Check WebSocket configuration:**
   - Ensure WebSocket server is using secure WSS protocol in production
   - Verify SSL/TLS certificates are valid
   - Check if WebSocket port is exposed in the deployment

3. **Add WebSocket error handling:**
   ```typescript
   // In client/src/hooks/useWebSocket.ts
   try {
     const ws = new WebSocket(wsUrl);
     ws.onerror = (event) => {
       console.error('[WebSocket] Connection error:', event);
       // Implement fallback to polling
     };
   } catch (error) {
     console.error('[WebSocket] Failed to connect:', error);
     // Use polling as fallback
   }
   ```

4. **Implement fallback to polling:**
   - If WebSocket fails, fall back to HTTP polling
   - This ensures the app remains functional even if WebSocket is unavailable

---

### 4. Service Worker CORS Errors
**Error Message:**
```
Uncaught (in promise) TypeError: Failed to convert value to 'Response'.
```

**Root Cause:**
- Service Worker is trying to cache CORS-blocked requests
- Manifest.json fetch is failing due to CORS policy
- Service Worker doesn't have proper error handling for failed requests

**Solution:**
1. **Update Service Worker to handle CORS errors:**
   ```typescript
   // In client/public/sw.js
   self.addEventListener('fetch', (event) => {
     if (event.request.url.includes('manifest.json')) {
       // Skip caching for manifest.json
       return event.respondWith(fetch(event.request));
     }
     
     // Handle other requests with fallback
     event.respondWith(
       caches.match(event.request)
         .then(response => response || fetch(event.request))
         .catch(() => new Response('Offline', { status: 503 }))
     );
   });
   ```

2. **Exclude problematic URLs from caching:**
   - Don't cache manifest.json
   - Don't cache OAuth endpoints
   - Don't cache WebSocket connections

---

### 5. SQL Syntax Error - Missing WHERE Clause Condition
**Error Message:**
```
Error: You have an error in your SQL syntax; check the manual that corresponds to your TiDB version 
for the right syntax to use line 1 column 33 near "= 1"
Failed query: select `id` from `farms` where  = ?
```

**Root Cause:**
- The `userId` parameter is undefined or null
- The WHERE clause is being constructed with an undefined value
- This happens in the `getQuickStats` procedure when user is not authenticated

**Solution:**
1. **Add null check before database query:**
   ```typescript
   // In server/routers/dashboard.ts
   getQuickStats: protectedProcedure.query(async ({ ctx }) => {
     const db = await getDb();
     const userId = ctx.user?.id;
     
     // Add validation
     if (!userId) {
       return {
         totalFarms: 0,
         totalFarmArea: 0,
         activeCrops: 0,
         pendingTasks: 0,
         weatherAlerts: 0,
         livestockCount: 0,
       };
     }
     
     // Continue with query...
   }),
   ```

2. **Verify user authentication:**
   - Ensure user is logged in before accessing protected routes
   - Check if OAuth callback is properly setting user context

---

## Secondary Issues

### 6. CSS Preload Warning
**Error Message:**
```
The resource https://www.farmconnekt.com/index.css was preloaded using link preload 
but not used within a few seconds from the window's load event.
```

**Solution:**
- Remove preload directive for CSS if it's not critical
- Or ensure CSS is used immediately on page load
- Update `client/index.html` to remove unnecessary preload tags

---

## Recommended Fix Priority

1. **HIGH (Blocking):**
   - Fix CORS manifest.json issue (configure Manus platform)
   - Fix React error #310 (debug hook usage)
   - Fix SQL syntax error (add null checks)

2. **MEDIUM (Functionality):**
   - Fix WebSocket connection (add fallback to polling)
   - Fix Service Worker CORS errors (update error handling)

3. **LOW (Polish):**
   - Fix CSS preload warning (remove unnecessary preloads)

---

## Testing Checklist

After applying fixes, verify:

- [ ] Manifest.json loads without CORS errors
- [ ] React app renders without error #310
- [ ] Dashboard loads and displays quick stats
- [ ] WebSocket connects successfully (or falls back to polling)
- [ ] Service Worker registers without errors
- [ ] CSS loads correctly without preload warnings
- [ ] User authentication flow works end-to-end
- [ ] Registration and login pages are accessible

---

## Contact Support

For Manus platform-specific issues (OAuth, domain configuration):
- Visit: https://help.manus.im
- Reference: CORS policy blocking manifest.json on custom domain
