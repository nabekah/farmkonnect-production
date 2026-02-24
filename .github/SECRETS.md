# GitHub Actions Secrets Configuration

This document explains the secrets required for GitHub Actions workflows to work properly.

## Required Secrets

### 1. Railway Deployment Secrets

**RAILWAY_TOKEN**
- Description: Railway API token for authentication
- How to get: Go to Railway.app → Account Settings → API Tokens → Create Token
- Scope: Full access to deployments
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

**RAILWAY_PROJECT_ID**
- Description: Your Railway project ID
- How to get: Go to Railway.app → Project → Settings → Copy Project ID
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

### 2. Application Secrets

**VITE_APP_ID**
- Description: Manus OAuth application ID
- Source: From Manus project settings
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

**VITE_FRONTEND_URL**
- Description: Your Railway deployment URL (e.g., https://farmkonnect-prod.railway.app)
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

### 3. Notification Secrets (Optional)

**SLACK_WEBHOOK**
- Description: Slack webhook URL for deployment notifications
- How to get: Create Slack App → Incoming Webhooks → Add webhook to channel
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

**SONAR_TOKEN**
- Description: SonarQube token for code quality analysis
- How to get: SonarCloud.io → Account → Security → Generate token
- Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

## How to Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/nabekah/farmkonnect-production
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Enter secret name and value
6. Click **Add secret**

## Secrets Setup Steps

### Step 1: Get Railway Token
```bash
# Go to Railway.app
# Account Settings → API Tokens → Create Token
# Copy the token
```

### Step 2: Get Railway Project ID
```bash
# Go to Railway.app
# Select your FarmKonnect project
# Settings → Copy Project ID
```

### Step 3: Add Secrets to GitHub
```bash
# For each secret:
# 1. Go to GitHub repo → Settings → Secrets and variables → Actions
# 2. Click "New repository secret"
# 3. Add secret name and value
```

## Secret Names and Values

| Secret Name | Value | Required |
|-------------|-------|----------|
| RAILWAY_TOKEN | Your Railway API token | ✅ Yes |
| RAILWAY_PROJECT_ID | Your Railway project ID | ✅ Yes |
| VITE_APP_ID | Your Manus app ID | ✅ Yes |
| VITE_FRONTEND_URL | Your Railway deployment URL | ✅ Yes |
| SLACK_WEBHOOK | Your Slack webhook URL | ❌ No |
| SONAR_TOKEN | Your SonarQube token | ❌ No |
| GITHUB_TOKEN | Auto-provided by GitHub | ✅ Auto |

## Verifying Secrets

After adding secrets, verify they're working:

1. Go to GitHub repo → **Actions** tab
2. Click on the latest workflow run
3. Check if deployment succeeded
4. If failed, click on the job to see error details

## Troubleshooting

### Workflow fails with "Invalid credentials"
- Verify RAILWAY_TOKEN is correct
- Check token hasn't expired
- Regenerate token if needed

### Deployment fails with "Project not found"
- Verify RAILWAY_PROJECT_ID is correct
- Make sure project exists in Railway.app
- Check token has access to project

### Slack notifications not working
- Verify SLACK_WEBHOOK URL is correct
- Check webhook is still active in Slack
- Test webhook manually

## Updating Secrets

To update a secret:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click the secret you want to update
3. Click "Update secret"
4. Enter new value
5. Click "Update secret"

## Rotating Secrets

For security, rotate secrets periodically:

1. **Railway Token**
   - Go to Railway.app → Account Settings → API Tokens
   - Delete old token
   - Create new token
   - Update RAILWAY_TOKEN in GitHub

2. **Slack Webhook**
   - Go to Slack → App Management → Incoming Webhooks
   - Delete old webhook
   - Create new webhook
   - Update SLACK_WEBHOOK in GitHub

## Security Best Practices

- ✅ Never commit secrets to git
- ✅ Rotate secrets every 3 months
- ✅ Use strong, random tokens
- ✅ Limit token scopes to minimum required
- ✅ Monitor token usage in logs
- ✅ Revoke unused tokens immediately
- ✅ Use separate tokens for different environments

## Environment Variables vs Secrets

**Secrets** (for sensitive data):
- API keys, tokens, passwords
- Database credentials
- Private configuration
- Stored encrypted in GitHub

**Environment Variables** (for non-sensitive data):
- App version
- Feature flags
- Public URLs
- Build configuration

## Next Steps

1. ✅ Add RAILWAY_TOKEN to GitHub secrets
2. ✅ Add RAILWAY_PROJECT_ID to GitHub secrets
3. ✅ Add VITE_APP_ID to GitHub secrets
4. ✅ Add VITE_FRONTEND_URL to GitHub secrets
5. ✅ (Optional) Add SLACK_WEBHOOK for notifications
6. ✅ Test workflow by pushing to main branch
7. ✅ Verify deployment in Railway.app

## Support

For issues with:
- **GitHub Secrets**: See GitHub docs on secrets
- **Railway**: Check Railway documentation
- **Slack**: Check Slack app documentation

---

**Remember**: Secrets are encrypted and never visible in logs. Always use the GitHub UI to manage secrets!
