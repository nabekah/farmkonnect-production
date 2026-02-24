# FarmKonnect Deployment Automation Guide

## Overview

This guide ensures that every code change made in Manus is automatically deployed to Railway via GitHub. This creates a continuous deployment pipeline:

```
Manus Development → GitHub Repository → Railway Production
```

---

## Part 1: GitHub Export Setup

### Step 1.1: Initial GitHub Export (One-time Setup)

**Via Manus Management UI:**

1. Open your FarmKonnect project
2. Go to **Management UI** (top-right icon)
3. Navigate to **Settings** → **GitHub**
4. Click **"Connect GitHub"** or **"Export to GitHub"**
5. Authorize Manus to access your GitHub account
6. Select or create repository: `farmkonnect-production`
7. Click **"Export Project"**
8. Wait for export to complete (2-5 minutes)

**What Gets Exported:**
- All source code (client, server, drizzle)
- Configuration files (package.json, tsconfig.json, etc.)
- Environment variable templates (.env.example)
- README and documentation
- Git history from Manus

### Step 1.2: Verify GitHub Repository

After export, verify the repository:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/farmkonnect-production.git
cd farmkonnect-production

# Check branches
git branch -a

# Check recent commits
git log --oneline -10

# Verify main branch exists
git branch | grep main
```

---

## Part 2: Railway Deployment Setup

### Step 2.1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub account
3. Click **"Create New Project"**
4. Select **"Deploy from GitHub"**
5. Authorize Railway with GitHub
6. Select repository: `farmkonnect-production`
7. Select branch: `main`
8. Click **"Deploy"**

### Step 2.2: Configure Environment Variables in Railway

In Railway dashboard:

1. Go to your project
2. Click **"Variables"** tab
3. Add all required environment variables:

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/farmkonnect

# Authentication
JWT_SECRET=your_jwt_secret_here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=https://your-railway-domain/api/oauth/callback

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@farmconnekt.com

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key

# App Configuration
VITE_APP_ID=your_app_id
VITE_APP_TITLE=FarmKonnect
VITE_APP_LOGO=https://your-domain/logo.png
VITE_FRONTEND_URL=https://your-railway-domain

# Weather API
OPENWEATHER_API_KEY=your_openweather_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications
VAPID_PRIVATE_KEY=your_vapid_private_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# Analytics
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

4. Click **"Save"** for each variable
5. Railway will auto-redeploy with new variables

### Step 2.3: Configure Build Settings

In Railway dashboard:

1. Go to **"Settings"** tab
2. Set **Start Command**:
   ```bash
   npm run start
   ```

3. Set **Build Command**:
   ```bash
   npm run build
   ```

4. Set **Node Version**: `22.13.0` or latest
5. Set **Port**: `3000`
6. Click **"Save"**

---

## Part 3: Automated Deployment Workflow

### Workflow: Every Code Change → Railway Deployment

**When you implement features in Manus:**

1. **Make Changes in Manus**
   - Edit files, create components, add features
   - Test locally in dev server

2. **Create Checkpoint**
   - Run `webdev_save_checkpoint` with description
   - Checkpoint saves to Manus internal storage

3. **Export to GitHub**
   - Go to Management UI → Settings → GitHub
   - Click **"Sync to GitHub"** or **"Push Latest"**
   - Select branch: `main`
   - Add commit message describing changes
   - Click **"Push to GitHub"**

4. **Railway Auto-Deploys**
   - Railway detects push to main branch
   - Railway pulls latest code from GitHub
   - Railway runs build command
   - Railway deploys to production
   - Deployment takes 2-5 minutes

5. **Verify Deployment**
   - Check Railway dashboard for deployment status
   - Visit your Railway domain to verify changes
   - Check logs for any errors

### Automated Deployment Checklist

**Before Each Checkpoint:**
- [ ] Code changes tested locally
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables set

**During Checkpoint:**
- [ ] Descriptive checkpoint message
- [ ] All files included in checkpoint
- [ ] No sensitive data in code

**After Checkpoint:**
- [ ] Export to GitHub
- [ ] Verify GitHub push successful
- [ ] Check Railway deployment status
- [ ] Verify production changes live
- [ ] Test critical user flows

---

## Part 4: Troubleshooting Deployment Issues

### Issue: Railway Deployment Fails

**Check:**
1. Railway dashboard → Deployments → View logs
2. Look for build errors or missing dependencies
3. Verify all environment variables are set
4. Check Node version compatibility

**Common Causes:**
- Missing environment variables
- Dependency installation failure
- TypeScript compilation errors
- Database connection issues

**Fix:**
```bash
# View Railway logs
railway logs

# Redeploy manually
railway deploy

# Check environment
railway env list
```

### Issue: Changes Not Appearing on Railway

**Check:**
1. Verify GitHub push was successful
2. Check Railway deployment status
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check Railway domain is correct

**Fix:**
```bash
# Force redeploy
# In Railway dashboard: Deployments → Redeploy Latest

# Or via CLI
railway redeploy
```

### Issue: Environment Variables Not Working

**Check:**
1. Variable names match exactly (case-sensitive)
2. Variable values don't have extra spaces
3. Special characters are properly escaped
4. Railway has been redeployed after variable changes

**Fix:**
```bash
# Verify variables in Railway
railway env list

# Update variable
railway env set VARIABLE_NAME=value

# Redeploy
railway redeploy
```

### Issue: Database Connection Failing

**Check:**
1. DATABASE_URL is correct
2. Database server is accessible
3. Credentials are correct
4. Network access is allowed

**Fix:**
```bash
# Test connection
railway run npm run db:push

# Check database logs
railway logs --service=database
```

---

## Part 5: Monitoring Deployments

### Railway Dashboard Monitoring

1. **Deployments Tab**
   - View deployment history
   - Check deployment status
   - View deployment logs
   - Rollback to previous version if needed

2. **Logs Tab**
   - Real-time application logs
   - Error tracking
   - Performance monitoring

3. **Metrics Tab**
   - CPU usage
   - Memory usage
   - Request count
   - Response time

### Setting Up Alerts

1. Go to **Settings** → **Alerts**
2. Enable notifications for:
   - Deployment failures
   - High CPU usage
   - High memory usage
   - High error rate

3. Add email or Slack webhook

### Rollback Procedure

If deployment breaks production:

1. Go to Railway dashboard
2. Click **"Deployments"**
3. Find previous working deployment
4. Click **"Rollback"**
5. Confirm rollback
6. Verify production is restored

---

## Part 6: Deployment Automation Checklist

### For Every Feature Implementation

**Development Phase:**
- [ ] Feature implemented in Manus
- [ ] Feature tested locally
- [ ] No errors in console
- [ ] TypeScript compiles
- [ ] Tests pass (if applicable)
- [ ] Database migrations applied
- [ ] Environment variables configured

**Checkpoint Phase:**
- [ ] Checkpoint created with description
- [ ] Checkpoint includes all changes
- [ ] No sensitive data in checkpoint
- [ ] Checkpoint saved successfully

**GitHub Export Phase:**
- [ ] Export to GitHub initiated
- [ ] GitHub push successful
- [ ] Commit message is descriptive
- [ ] GitHub shows latest changes

**Railway Deployment Phase:**
- [ ] Railway detects new push
- [ ] Build starts automatically
- [ ] Build completes successfully
- [ ] Deployment starts
- [ ] Deployment completes
- [ ] No deployment errors

**Verification Phase:**
- [ ] Visit Railway domain
- [ ] New features visible
- [ ] No broken functionality
- [ ] Performance acceptable
- [ ] Logs show no errors
- [ ] Critical user flows work

---

## Part 7: Quick Reference Commands

### Railway CLI Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# View logs
railway logs

# View environment variables
railway env list

# Set environment variable
railway env set KEY=value

# Run command in Railway environment
railway run npm run db:push

# Redeploy
railway redeploy

# View deployment status
railway status
```

### GitHub Commands

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/farmkonnect-production.git

# Check status
git status

# View recent commits
git log --oneline -10

# Pull latest changes
git pull origin main

# Push changes
git push origin main

# Create new branch
git checkout -b feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

---

## Summary

**Deployment Pipeline:**
1. Develop in Manus → 2. Create Checkpoint → 3. Export to GitHub → 4. Railway Auto-Deploys → 5. Verify Production

**Key Points:**
- Every checkpoint should be exported to GitHub
- Railway auto-deploys on every GitHub push
- Environment variables must be set in Railway
- Monitor deployments via Railway dashboard
- Rollback available if deployment breaks

**Next Steps:**
1. Export current project to GitHub
2. Connect Railway to GitHub repository
3. Set all environment variables in Railway
4. Test deployment pipeline
5. Verify production deployment works

---

## Support

For issues with:
- **Manus**: Contact Manus support
- **GitHub**: Check GitHub documentation
- **Railway**: Visit Railway documentation or support

For questions about this workflow, refer to the deployment automation guide or contact your DevOps team.
