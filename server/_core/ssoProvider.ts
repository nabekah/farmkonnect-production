import crypto from "crypto";

/**
 * SSO Provider Configuration
 */
export interface SsoProviderConfig {
  id: string;
  name: string;
  type: "saml" | "oidc";
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  idpUrl?: string;
  metadataUrl?: string;
  discoveryUrl?: string;
  redirectUri: string;
  logoutUrl?: string;
  certificateUrl?: string;
  attributes?: Record<string, string>;
}

/**
 * SAML Configuration
 */
export interface SamlConfig extends SsoProviderConfig {
  type: "saml";
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl?: string;
  nameIdFormat?: string;
}

/**
 * OpenID Connect Configuration
 */
export interface OidcConfig extends SsoProviderConfig {
  type: "oidc";
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  scopes: string[];
}

/**
 * SSO User Information
 */
export interface SsoUserInfo {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  provider: string;
  providerUserId: string;
  metadata?: Record<string, any>;
}

/**
 * SSO Provider Service
 */
class SsoProviderService {
  private providers: Map<string, SsoProviderConfig> = new Map();
  private userMappings: Map<string, { userId: string; provider: string; providerUserId: string }> = new Map();

  /**
   * Register SAML provider
   * @param config - SAML configuration
   * @returns Success status
   */
  registerSamlProvider(config: SamlConfig): boolean {
    if (!config.id || !config.name || !config.idpUrl) {
      return false;
    }

    this.providers.set(config.id, config);
    return true;
  }

  /**
   * Register OpenID Connect provider
   * @param config - OpenID Connect configuration
   * @returns Success status
   */
  registerOidcProvider(config: OidcConfig): boolean {
    if (!config.id || !config.name || !config.authorizationEndpoint || !config.tokenEndpoint) {
      return false;
    }

    this.providers.set(config.id, config);
    return true;
  }

  /**
   * Get provider configuration
   * @param providerId - Provider ID
   * @returns Provider configuration or null
   */
  getProvider(providerId: string): SsoProviderConfig | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get all enabled providers
   * @returns Array of enabled providers
   */
  getEnabledProviders(): SsoProviderConfig[] {
    const providers: SsoProviderConfig[] = [];

    for (const [, provider] of this.providers.entries()) {
      if (provider.enabled) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Generate SAML authorization request
   * @param providerId - Provider ID
   * @returns SAML request XML
   */
  generateSamlRequest(providerId: string): string {
    const provider = this.getProvider(providerId) as SamlConfig | null;

    if (!provider || provider.type !== "saml") {
      return "";
    }

    const requestId = this.generateId();
    const issueInstant = new Date().toISOString();

    const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${provider.idpUrl}"
  AssertionConsumerServiceURL="${provider.assertionConsumerServiceUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${provider.entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="${provider.nameIdFormat || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"}" AllowCreate="true"/>
</samlp:AuthnRequest>`;

    return Buffer.from(samlRequest).toString("base64");
  }

  /**
   * Generate OpenID Connect authorization URL
   * @param providerId - Provider ID
   * @param state - State parameter for CSRF protection
   * @param nonce - Nonce parameter for token validation
   * @returns Authorization URL
   */
  generateOidcAuthorizationUrl(providerId: string, state: string, nonce: string): string {
    const provider = this.getProvider(providerId) as OidcConfig | null;

    if (!provider || provider.type !== "oidc") {
      return "";
    }

    const params = new URLSearchParams({
      client_id: provider.clientId || "",
      redirect_uri: provider.redirectUri,
      response_type: "code",
      scope: provider.scopes.join(" "),
      state,
      nonce,
    });

    return `${provider.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for token (OpenID Connect)
   * @param providerId - Provider ID
   * @param code - Authorization code
   * @returns Token response (mock)
   */
  async exchangeOidcCode(providerId: string, code: string): Promise<{ accessToken: string; idToken: string }> {
    const provider = this.getProvider(providerId) as OidcConfig | null;

    if (!provider || provider.type !== "oidc") {
      throw new Error("Invalid provider");
    }

    // In production, make actual HTTP request to token endpoint
    return {
      accessToken: this.generateToken(),
      idToken: this.generateToken(),
    };
  }

  /**
   * Map SSO user to FarmKonnect user
   * @param userId - FarmKonnect user ID
   * @param provider - Provider ID
   * @param providerUserId - Provider user ID
   * @returns Success status
   */
  mapSsoUser(userId: string, provider: string, providerUserId: string): boolean {
    const key = `${provider}:${providerUserId}`;
    this.userMappings.set(key, { userId, provider, providerUserId });
    return true;
  }

  /**
   * Get FarmKonnect user ID from SSO provider
   * @param provider - Provider ID
   * @param providerUserId - Provider user ID
   * @returns FarmKonnect user ID or null
   */
  getUserIdFromSso(provider: string, providerUserId: string): string | null {
    const key = `${provider}:${providerUserId}`;
    const mapping = this.userMappings.get(key);
    return mapping ? mapping.userId : null;
  }

  /**
   * Get SSO providers for a user
   * @param userId - FarmKonnect user ID
   * @returns Array of connected SSO providers
   */
  getUserSsoProviders(userId: string): Array<{ provider: string; providerUserId: string }> {
    const providers: Array<{ provider: string; providerUserId: string }> = [];

    for (const [, mapping] of this.userMappings.entries()) {
      if (mapping.userId === userId) {
        providers.push({
          provider: mapping.provider,
          providerUserId: mapping.providerUserId,
        });
      }
    }

    return providers;
  }

  /**
   * Disconnect SSO provider from user
   * @param userId - FarmKonnect user ID
   * @param provider - Provider ID
   * @returns Success status
   */
  disconnectSsoProvider(userId: string, provider: string): boolean {
    let found = false;

    for (const [key, mapping] of this.userMappings.entries()) {
      if (mapping.userId === userId && mapping.provider === provider) {
        this.userMappings.delete(key);
        found = true;
      }
    }

    return found;
  }

  /**
   * Get SSO statistics
   * @returns Statistics object
   */
  getStatistics() {
    return {
      totalProviders: this.providers.size,
      enabledProviders: this.getEnabledProviders().length,
      samlProviders: Array.from(this.providers.values()).filter((p) => p.type === "saml").length,
      oidcProviders: Array.from(this.providers.values()).filter((p) => p.type === "oidc").length,
      mappedUsers: this.userMappings.size,
    };
  }

  /**
   * Generate unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return `_${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Generate token
   * @returns Token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

export const ssoProvider = new SsoProviderService();

// Register default providers
ssoProvider.registerOidcProvider({
  id: "google",
  name: "Google",
  type: "oidc",
  enabled: true,
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: "https://www.farmconnekt.com/api/oauth/google/callback",
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  scopes: ["openid", "email", "profile"],
});

ssoProvider.registerOidcProvider({
  id: "microsoft",
  name: "Microsoft",
  type: "oidc",
  enabled: false,
  redirectUri: "https://www.farmconnekt.com/api/oauth/microsoft/callback",
  authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  userinfoEndpoint: "https://graph.microsoft.com/v1.0/me",
  jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
  scopes: ["openid", "email", "profile"],
});
