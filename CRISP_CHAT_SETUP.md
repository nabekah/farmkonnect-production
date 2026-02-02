# Crisp Live Chat Setup Guide

This guide explains how to set up Crisp live chat support for FarmKonnect.

---

## Step 1: Create Crisp Account

1. Visit [https://crisp.chat](https://crisp.chat)
2. Click "Sign Up" and create a free account
3. Complete the registration process
4. Verify your email address

---

## Step 2: Get Your Website ID

1. Log in to your Crisp dashboard
2. Click on "Settings" in the left sidebar
3. Navigate to "Website Settings" → "Setup Instructions"
4. Copy your **Website ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Step 3: Configure FarmKonnect

1. Open `client/index.html`
2. Find the line:
   ```javascript
   window.CRISP_WEBSITE_ID="YOUR_CRISP_WEBSITE_ID_HERE";
   ```
3. Replace `YOUR_CRISP_WEBSITE_ID_HERE` with your actual Website ID:
   ```javascript
   window.CRISP_WEBSITE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
   ```
4. Save the file and restart the dev server

---

## Step 4: Customize Chat Widget

In your Crisp dashboard, you can customize:

### Appearance
- **Color Theme**: Match your brand colors (green/emerald for FarmKonnect)
- **Position**: Bottom right (recommended) or bottom left
- **Chat Box Size**: Default or compact

### Welcome Message
Set an automated greeting message:
```
👋 Welcome to FarmKonnect! 

How can we help you manage your farm today?

Our team typically responds within 5 minutes during business hours (8 AM - 6 PM GMT).
```

### Availability Hours
Configure your support hours:
- **Monday - Friday**: 8:00 AM - 6:00 PM (GMT)
- **Saturday**: 9:00 AM - 2:00 PM (GMT)
- **Sunday**: Closed

### Automated Responses
Set up common questions:
- "How do I register a farm?"
- "How do I track my crops?"
- "How do I enable weather alerts?"
- "How do I list products in the marketplace?"

---

## Step 5: Mobile App Integration

For the React Native mobile app, install the Crisp SDK:

```bash
npm install react-native-crisp-chat-sdk
```

Then configure in your app:

```typescript
import CrispChat from 'react-native-crisp-chat-sdk';

// Initialize Crisp
CrispChat.configure('YOUR_CRISP_WEBSITE_ID_HERE');

// Set user information
CrispChat.setUserEmail(user.email);
CrispChat.setUserNickname(user.name);

// Open chat
CrispChat.show();
```

---

## Step 6: Team Management

Add team members to handle support:

1. Go to "Settings" → "Team"
2. Click "Invite Team Member"
3. Enter email addresses of support staff
4. Assign roles (Admin, Member, Viewer)

---

## Features to Enable

### Chatbot (Optional)
Create automated responses for common questions:
- Farm registration process
- Crop tracking tutorials
- Weather alert setup
- Marketplace listing guide

### Knowledge Base Integration
Link to your help documentation:
- User guides
- Video tutorials
- FAQ articles

### Email Notifications
Get notified when:
- New conversation starts
- User sends a message
- Conversation is resolved

---

## Testing

1. Visit your FarmKonnect landing page
2. Look for the chat widget in the bottom-right corner
3. Click to open the chat
4. Send a test message
5. Check your Crisp dashboard to see the message

---

## Pricing

- **Free Plan**: Up to 2 operators, unlimited conversations
- **Pro Plan**: $25/month per operator, advanced features
- **Unlimited Plan**: $95/month, unlimited operators

The free plan is sufficient for getting started!

---

## Best Practices

1. **Response Time**: Aim to respond within 5 minutes during business hours
2. **Personalization**: Use visitor data to personalize responses
3. **Proactive Chat**: Set up triggers to engage visitors (e.g., after 30 seconds on pricing page)
4. **Follow-up**: Send follow-up emails for unresolved conversations
5. **Analytics**: Review chat transcripts to identify common issues and improve documentation

---

## Support

If you need help with Crisp:
- Documentation: https://docs.crisp.chat
- Support: support@crisp.chat
- Community: https://community.crisp.chat

---

## Alternative Chat Platforms

If Crisp doesn't meet your needs, consider:

- **Intercom**: More features, higher cost
- **Tawk.to**: Free forever, ad-supported
- **LiveChat**: Enterprise-grade, expensive
- **Drift**: Sales-focused, conversational marketing
