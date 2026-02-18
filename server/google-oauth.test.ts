import { describe, it, expect } from 'vitest';
import { OAuth2Client } from 'google-auth-library';

describe('Google OAuth Credentials', () => {
  it('should have valid Google OAuth credentials configured', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUrl = process.env.GOOGLE_REDIRECT_URL;

    // Verify all credentials are present
    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(redirectUrl).toBeDefined();

    // Verify Client ID format
    expect(clientId).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);

    // Verify Client Secret format
    expect(clientSecret).toMatch(/^GOCSPX-[a-zA-Z0-9_-]+$/);

    // Verify Redirect URL format
    expect(redirectUrl).toMatch(/^https?:\/\/.+\/api\/oauth\/google\/callback$/);
  });

  it('should be able to create OAuth2Client with the credentials', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUrl = process.env.GOOGLE_REDIRECT_URL;

    expect(() => {
      const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        redirectUrl
      );
      expect(oauth2Client).toBeDefined();
    }).not.toThrow();
  });

  it('should generate valid authorization URL', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUrl = process.env.GOOGLE_REDIRECT_URL;

    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUrl
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
    });

    expect(authUrl).toBeDefined();
    expect(authUrl).toContain('client_id=' + clientId);
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('scope=');
  });
});
