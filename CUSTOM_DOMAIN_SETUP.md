# Custom Domain Setup Guide for FarmKonnect on Railway

This guide explains how to point a custom domain to your Railway deployment and configure it with Manus OAuth.

---

## Overview

When you're ready to use a custom domain (e.g., `farmkonnect.com`) with your Railway deployment, follow these steps:

1. **Buy/Register a domain**
2. **Get DNS records from Railway**
3. **Add DNS records to your domain registrar**
4. **Add domain to Manus project**
5. **Test OAuth login**

---

## Step 1: Buy/Register a Domain

### Option A: Buy through Manus (Recommended)
1. Go to your Manus project → Settings → Domains
2. Click "Buy a new domain"
3. Search for your desired domain
4. Complete the purchase
5. Domain is automatically added to your project

### Option B: Buy from External Registrar
Popular registrars:
- **GoDaddy** (godaddy.com)
- **Namecheap** (namecheap.com)
- **Google Domains** (domains.google.com)
- **Bluehost** (bluehost.com)
- **HostGator** (hostgator.com)

---

## Step 2: Get DNS Records from Railway

### From Railway Dashboard:

1. **Go to Railway** → https://railway.app
2. **Select your FarmKonnect project**
3. **Click on your app service** (Node.js app)
4. **Go to "Settings" tab**
5. **Look for "Domains" section**
6. **Click "Add Domain"**
7. **Enter your domain name** (e.g., `farmkonnect.com`)
8. **Railway will show you DNS records to add:**

Example DNS records Railway provides:
```
Type: CNAME
Name: www
Value: cname.railway.app

Type: A
Name: @
Value: 1.2.3.4 (example IP)
```

---

## Step 3: Add DNS Records to Your Domain Registrar

### For GoDaddy Example:

1. **Log in to GoDaddy** → https://godaddy.com
2. **Go to "My Products"**
3. **Find your domain** → Click "Manage"
4. **Click "DNS"** tab
5. **Look for "DNS Records" section**
6. **Add the records Railway provided:**

#### Adding CNAME Record:
- Click "Add Record"
- **Type:** CNAME
- **Name:** www (or @ for root)
- **Value:** cname.railway.app
- **TTL:** 3600 (default)
- **Click Save**

#### Adding A Record (if needed):
- Click "Add Record"
- **Type:** A
- **Name:** @ (for root domain)
- **Value:** [IP from Railway]
- **TTL:** 3600
- **Click Save**

### For Other Registrars:
The process is similar:
1. Find DNS/Domain Management section
2. Add DNS records
3. Save changes

---

## Step 4: Add Domain to Manus Project

### Configure in Manus:

1. **Go to Manus Dashboard** → Your FarmKonnect project
2. **Click Settings** → **Domains**
3. **Click "Connect an existing domain"**
4. **Enter your domain** (e.g., `farmkonnect.com`)
5. **Manus will provide CNAME record:**
   ```
   Name: farmkonnect
   Value: cname.manus.space
   ```
6. **Add this CNAME to your domain registrar** (same process as Step 3)
7. **Click "Verify"** in Manus
8. **Wait for DNS propagation** (5-30 minutes)

---

## Step 5: Configure Railway to Use Custom Domain

### In Railway:

1. **Go to Railway** → Your app
2. **Settings** → **Domains**
3. **Add your custom domain** (e.g., `farmkonnect.com`)
4. **Railway will show SSL certificate status**
5. **Wait for SSL certificate to be issued** (usually automatic)

---

## Step 6: Test OAuth Login

### Verify Everything Works:

1. **Visit your custom domain** (e.g., `https://farmkonnect.com`)
2. **Click "Sign In"**
3. **Should redirect to Manus login** (no error)
4. **Log in with your account**
5. **Should redirect back to your app** ✅

If you see the error:
```
[internal] authorization failed: invalid redirect_uri
```

**Solution:** Make sure you added the domain to your Manus project in Step 4.

---

## DNS Propagation

**Important:** DNS changes take time to propagate globally (5 minutes to 48 hours).

### Check DNS Status:

**Online tools:**
- https://mxtoolbox.com/
- https://whatsmydns.net/
- https://dnschecker.org/

**Command line:**
```bash
# Check if DNS is propagated
nslookup farmkonnect.com
dig farmkonnect.com
```

---

## Troubleshooting

### Issue: Domain not working after adding DNS records

**Solution:**
1. Wait 10-30 minutes for DNS propagation
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private window
4. Check DNS records are correct using online tools

### Issue: SSL Certificate Error

**Solution:**
1. Wait 5-10 minutes for SSL certificate to be issued
2. Refresh the page
3. Check Railway dashboard for certificate status

### Issue: OAuth still shows "invalid redirect_uri"

**Solution:**
1. Verify domain is added to Manus project
2. Wait 5 minutes for Manus to recognize the domain
3. Try logging in again
4. Check Manus project settings → Domains

### Issue: App shows Railway error page

**Solution:**
1. Verify domain is added to Railway
2. Check Railway app is running (green status)
3. Verify DNS records point to Railway
4. Check Railway logs for errors

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Buy domain | 5 min |
| 2 | Get DNS records from Railway | 2 min |
| 3 | Add DNS to registrar | 5 min |
| 4 | Add domain to Manus | 5 min |
| 5 | Configure Railway | 5 min |
| 6 | Wait for DNS propagation | 5-30 min |
| 7 | Test OAuth login | 2 min |
| **Total** | | **30-60 min** |

---

## Next Steps After Setup

Once your custom domain is working:

1. ✅ Update Railway environment variables if needed
2. ✅ Test all app features (login, dashboard, etc.)
3. ✅ Share the domain with mobile workers
4. ✅ Monitor app performance in Railway dashboard
5. ✅ Set up SSL certificate auto-renewal (usually automatic)

---

## Support

If you encounter issues:

1. **Railway Support:** https://railway.app/support
2. **Manus Help Center:** https://help.manus.im
3. **Domain Registrar Support:** Check your registrar's help center
4. **DNS Propagation Check:** https://whatsmydns.net/

---

## Example Configuration

### For domain: `farmkonnect.com`

**Railway DNS Records:**
```
Type: CNAME
Name: www
Value: cname.railway.app

Type: A
Name: @
Value: 1.2.3.4
```

**Manus DNS Records:**
```
Type: CNAME
Name: farmkonnect
Value: cname.manus.space
```

**Final URLs:**
- **App:** https://farmkonnect.com
- **Manus Domain:** https://farmkonnect-wzqk4bd8.manus.space (backup)
- **Railway Domain:** https://farmkonnectapp-production.up.railway.app (no OAuth)

---

**Ready to set up your custom domain? Follow the steps above when you're ready!**
