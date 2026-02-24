# FarmKonnect Deployment Checklist

## ✅ Pre-Deployment Checklist

Use this checklist **BEFORE** every checkpoint and deployment to Railway.

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in dev server
- [ ] No console warnings (except expected ones)
- [ ] Code follows project conventions
- [ ] No hardcoded credentials or secrets
- [ ] All imports are correct
- [ ] No unused imports or variables

### Testing
- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass
- [ ] Feature tests pass
- [ ] No failing tests
- [ ] Test coverage adequate
- [ ] Error cases handled

### Functionality
- [ ] Feature works as intended
- [ ] No breaking changes to existing features
- [ ] User flows tested manually
- [ ] Edge cases handled
- [ ] Error messages are clear
- [ ] Loading states work correctly

### Database
- [ ] Database migrations applied
- [ ] Schema changes are backward compatible
- [ ] No data loss
- [ ] Indexes created if needed
- [ ] Queries are optimized

### Environment
- [ ] All required environment variables defined
- [ ] Environment variables documented
- [ ] Secrets are not in code
- [ ] .env.example updated
- [ ] Configuration is environment-specific

### Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Component documentation added
- [ ] Deployment notes added
- [ ] Breaking changes documented

---

## 📋 Checkpoint Creation Checklist

Use this checklist **DURING** checkpoint creation.

### Checkpoint Details
- [ ] Descriptive checkpoint message
- [ ] Message includes feature name
- [ ] Message includes what was changed
- [ ] Message includes any breaking changes
- [ ] Checkpoint description is clear

### Files Included
- [ ] All modified files included
- [ ] New files included
- [ ] Configuration files included
- [ ] No temporary files included
- [ ] No node_modules included
- [ ] No .env files included

### Checkpoint Verification
- [ ] Checkpoint saved successfully
- [ ] Checkpoint version ID noted
- [ ] Checkpoint appears in history
- [ ] Checkpoint can be viewed
- [ ] Checkpoint size is reasonable

---

## 🚀 GitHub Export Checklist

Use this checklist **AFTER** checkpoint creation.

### GitHub Export
- [ ] GitHub connection verified
- [ ] Repository selected correctly
- [ ] Branch is `main`
- [ ] Export initiated successfully
- [ ] Export completed without errors
- [ ] Commit message is descriptive

### GitHub Verification
- [ ] GitHub shows latest push
- [ ] Commit appears in history
- [ ] All files present in GitHub
- [ ] No merge conflicts
- [ ] GitHub Actions passing (if configured)
- [ ] Code review not required (or approved)

---

## 🚂 Railway Deployment Checklist

Use this checklist **DURING** Railway deployment.

### Deployment Initiation
- [ ] Railway detects GitHub push
- [ ] Deployment status shows "Building"
- [ ] Build logs appear in Railway dashboard
- [ ] No build errors in logs

### Build Phase
- [ ] Dependencies install successfully
- [ ] TypeScript compiles
- [ ] Build completes
- [ ] Build artifacts created
- [ ] Build time is reasonable

### Deployment Phase
- [ ] Deployment status shows "Deploying"
- [ ] Environment variables loaded
- [ ] Database migrations run
- [ ] Application starts
- [ ] Deployment completes
- [ ] Deployment time is reasonable

### Post-Deployment
- [ ] Deployment status shows "Success"
- [ ] No errors in deployment logs
- [ ] Application is running
- [ ] Health check passes
- [ ] Logs show normal operation

---

## ✅ Post-Deployment Verification

Use this checklist **AFTER** Railway deployment completes.

### Production Access
- [ ] Railway domain is accessible
- [ ] HTTPS certificate valid
- [ ] Page loads without errors
- [ ] No 404 or 500 errors
- [ ] Response time acceptable

### Feature Verification
- [ ] New feature is visible
- [ ] Feature works as expected
- [ ] Feature doesn't break existing functionality
- [ ] UI looks correct
- [ ] Mobile responsive works
- [ ] All links work

### User Flows
- [ ] Login flow works
- [ ] Welcome page displays
- [ ] Profile page accessible
- [ ] Password change works
- [ ] Logout works
- [ ] Admin features accessible

### Data & Database
- [ ] Data persists correctly
- [ ] Database queries work
- [ ] No data corruption
- [ ] Migrations applied successfully
- [ ] Rollback not needed

### Performance
- [ ] Page load time acceptable
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Database queries optimized
- [ ] No timeout issues

### Monitoring
- [ ] Railway dashboard shows healthy
- [ ] No error logs
- [ ] Metrics look normal
- [ ] Alerts not triggered
- [ ] No performance degradation

---

## 🔄 Rollback Procedure

If deployment has issues, use this checklist to rollback.

### Decision to Rollback
- [ ] Issue identified in production
- [ ] Issue is critical (not cosmetic)
- [ ] Issue affects user experience
- [ ] Rollback is appropriate response
- [ ] Previous version was stable

### Rollback Steps
- [ ] Go to Railway dashboard
- [ ] Navigate to Deployments
- [ ] Find previous working deployment
- [ ] Click "Rollback"
- [ ] Confirm rollback
- [ ] Wait for rollback to complete

### Post-Rollback Verification
- [ ] Production is restored
- [ ] Previous functionality works
- [ ] No data loss
- [ ] Users can access app
- [ ] Logs show normal operation

### Investigation
- [ ] Identify root cause of issue
- [ ] Fix the issue in code
- [ ] Test fix locally
- [ ] Create new checkpoint
- [ ] Export to GitHub
- [ ] Deploy again

---

## 📊 Deployment Status Tracking

Track deployment status for each feature:

| Feature | Checkpoint ID | GitHub Commit | Railway Status | Date | Notes |
|---------|---------------|---------------|----------------|------|-------|
| 2FA/MFA | 87fd99a7 | abc1234 | ✅ Deployed | 2026-02-24 | Working |
| User Profile | TBD | TBD | ⏳ Pending | TBD | TBD |
| Email Notifications | TBD | TBD | ⏳ Pending | TBD | TBD |

---

## 🚨 Common Issues & Fixes

### Build Fails
- [ ] Check build logs for errors
- [ ] Verify dependencies installed
- [ ] Check TypeScript compilation
- [ ] Verify environment variables
- [ ] Check Node version

### Deployment Fails
- [ ] Check deployment logs
- [ ] Verify database connection
- [ ] Check environment variables
- [ ] Verify port configuration
- [ ] Check start command

### Feature Not Working
- [ ] Check browser console for errors
- [ ] Check Railway logs
- [ ] Verify environment variables
- [ ] Check database connection
- [ ] Test locally first

### Performance Issues
- [ ] Check Railway metrics
- [ ] Optimize database queries
- [ ] Check for memory leaks
- [ ] Review application logs
- [ ] Check third-party API calls

---

## 📝 Deployment Notes Template

For each deployment, document:

```markdown
## Deployment: [Feature Name]

**Date**: [Date]
**Checkpoint ID**: [ID]
**GitHub Commit**: [Commit Hash]
**Railway Status**: [Status]

### Changes
- [Change 1]
- [Change 2]
- [Change 3]

### Testing
- [Test 1]: ✅ Passed
- [Test 2]: ✅ Passed
- [Test 3]: ✅ Passed

### Issues
- [Issue 1]: [Resolution]
- [Issue 2]: [Resolution]

### Performance
- Build time: [X] minutes
- Deployment time: [X] minutes
- Page load time: [X] ms

### Rollback Status
- Rollback needed: ✅ No / ❌ Yes
- Reason: [If yes, explain]
- Rollback time: [If yes, time taken]

### Notes
[Any additional notes]
```

---

## 🎯 Quick Reference

**Deployment Pipeline:**
```
Code Change → Checkpoint → GitHub Export → Railway Deploy → Verify
```

**Key Commands:**
```bash
# Create checkpoint
webdev_save_checkpoint

# Export to GitHub
# (Via Manus UI: Settings → GitHub → Push)

# Check Railway status
railway status

# View logs
railway logs

# Redeploy if needed
railway redeploy
```

**Critical Checks:**
- ✅ No TypeScript errors
- ✅ Tests passing
- ✅ Environment variables set
- ✅ Database migrations applied
- ✅ GitHub push successful
- ✅ Railway deployment successful
- ✅ Production verification complete

---

## 📞 Support

For deployment issues:
1. Check this checklist
2. Review deployment logs
3. Check Railway dashboard
4. Review GitHub commits
5. Contact support if needed

**Remember**: Always verify production after deployment!
