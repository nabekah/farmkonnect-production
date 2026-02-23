import { describe, it, expect } from "vitest";

describe("Email Configuration Secrets", () => {
  it("should have SENDGRID_FROM_EMAIL set to verified sender", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toBe("noreply@farmconnekt.com");
  });

  it("should have VITE_FRONTEND_URL set to production domain", () => {
    const frontendUrl = process.env.VITE_FRONTEND_URL;
    expect(frontendUrl).toBeDefined();
    expect(frontendUrl).toBe("https://www.farmconnekt.com");
  });

  it("should have SENDGRID_API_KEY configured", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("SG.")).toBe(true);
  });
});
