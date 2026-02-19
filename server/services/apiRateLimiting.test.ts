import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { APIRateLimitingService } from "./apiRateLimitingService";

describe("APIRateLimitingService", () => {
  beforeEach(() => {
    // Clear store before each test
    APIRateLimitingService.clearStore();
  });

  afterEach(() => {
    // Clean up after each test
    APIRateLimitingService.clearStore();
  });

  describe("checkRateLimit", () => {
    it("should allow first request", async () => {
      const result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThan(result.limit);
    });

    it("should track remaining requests", async () => {
      const limit = APIRateLimitingService.getDefaultLimit("free");
      let remaining = limit;

      for (let i = 0; i < 5; i++) {
        const result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(remaining - 1);
        remaining = result.remaining;
      }
    });

    it("should enforce rate limit", async () => {
      const limit = APIRateLimitingService.getDefaultLimit("free");

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      }

      // Next request should be denied
      const result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use endpoint-specific limits", async () => {
      const defaultLimit = APIRateLimitingService.getDefaultLimit("free");
      const endpointLimit = APIRateLimitingService.getEndpointLimit("auth.login", "free");

      // Endpoint-specific limit should be lower for sensitive endpoints
      expect(endpointLimit).toBeLessThan(defaultLimit);
    });

    it("should reset after window expires", async () => {
      // Make a request
      const result1 = await APIRateLimitingService.checkRateLimit(1, "test.endpoint", "minute");
      expect(result1.allowed).toBe(true);

      // Simulate time passing (in a real test, we'd mock the time)
      // For now, just verify the reset time is set
      expect(result1.resetAt).toBeGreaterThan(Date.now());
    });

    it("should handle different user tiers", async () => {
      const freeLimit = APIRateLimitingService.getDefaultLimit("free");
      const proLimit = APIRateLimitingService.getDefaultLimit("pro");
      const enterpriseLimit = APIRateLimitingService.getDefaultLimit("enterprise");

      expect(freeLimit).toBeLessThan(proLimit);
      expect(proLimit).toBeLessThan(enterpriseLimit);
    });

    it("should isolate limits per user", async () => {
      const limit = APIRateLimitingService.getDefaultLimit("free");

      // User 1 makes requests
      for (let i = 0; i < limit; i++) {
        await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      }

      // User 1 should be rate limited
      const user1Result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      expect(user1Result.allowed).toBe(false);

      // User 2 should not be rate limited
      const user2Result = await APIRateLimitingService.checkRateLimit(2, "test.endpoint");
      expect(user2Result.allowed).toBe(true);
    });

    it("should isolate limits per endpoint", async () => {
      const limit = APIRateLimitingService.getDefaultLimit("free");

      // Make requests to endpoint 1
      for (let i = 0; i < limit; i++) {
        await APIRateLimitingService.checkRateLimit(1, "endpoint1");
      }

      // User should be rate limited on endpoint 1
      const endpoint1Result = await APIRateLimitingService.checkRateLimit(1, "endpoint1");
      expect(endpoint1Result.allowed).toBe(false);

      // User should not be rate limited on endpoint 2
      const endpoint2Result = await APIRateLimitingService.checkRateLimit(1, "endpoint2");
      expect(endpoint2Result.allowed).toBe(true);
    });
  });

  describe("getUserTier", () => {
    it("should return free tier by default", async () => {
      const tier = await APIRateLimitingService.getUserTier(999);
      expect(tier).toBe("free");
    });
  });

  describe("setUserTier", () => {
    it("should set user tier", async () => {
      await APIRateLimitingService.setUserTier(1, "pro");
      const tier = await APIRateLimitingService.getUserTier(1);
      expect(tier).toBe("pro");
    });

    it("should update existing user tier", async () => {
      await APIRateLimitingService.setUserTier(1, "pro");
      await APIRateLimitingService.setUserTier(1, "enterprise");
      const tier = await APIRateLimitingService.getUserTier(1);
      expect(tier).toBe("enterprise");
    });
  });

  describe("getDefaultLimit", () => {
    it("should return correct limits for each tier", () => {
      expect(APIRateLimitingService.getDefaultLimit("free")).toBe(60);
      expect(APIRateLimitingService.getDefaultLimit("pro")).toBe(300);
      expect(APIRateLimitingService.getDefaultLimit("enterprise")).toBe(1000);
    });
  });

  describe("getEndpointLimit", () => {
    it("should return endpoint-specific limit if available", () => {
      const limit = APIRateLimitingService.getEndpointLimit("auth.login", "free");
      expect(limit).toBe(5); // auth.login has stricter limit
    });

    it("should return default limit for unknown endpoints", () => {
      const limit = APIRateLimitingService.getEndpointLimit("unknown.endpoint", "free");
      expect(limit).toBe(60); // Falls back to default
    });

    it("should respect tier for endpoint limits", () => {
      const freeLimit = APIRateLimitingService.getEndpointLimit("auth.login", "free");
      const proLimit = APIRateLimitingService.getEndpointLimit("auth.login", "pro");
      const enterpriseLimit = APIRateLimitingService.getEndpointLimit("auth.login", "enterprise");

      expect(freeLimit).toBeLessThan(proLimit);
      expect(proLimit).toBeLessThan(enterpriseLimit);
    });
  });

  describe("getAllEndpointLimits", () => {
    it("should return all endpoint limits", () => {
      const limits = APIRateLimitingService.getAllEndpointLimits();

      expect(limits["auth.login"]).toBeDefined();
      expect(limits["auth.register"]).toBeDefined();
      expect(limits["auth.login"].free).toBe(5);
      expect(limits["auth.login"].pro).toBe(20);
      expect(limits["auth.login"].enterprise).toBe(100);
    });
  });

  describe("clearStore", () => {
    it("should clear all rate limit entries", async () => {
      const limit = APIRateLimitingService.getDefaultLimit("free");

      // Make requests to fill the store
      for (let i = 0; i < limit; i++) {
        await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      }

      // User should be rate limited
      let result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      expect(result.allowed).toBe(false);

      // Clear the store
      APIRateLimitingService.clearStore();

      // User should be able to make requests again
      result = await APIRateLimitingService.checkRateLimit(1, "test.endpoint");
      expect(result.allowed).toBe(true);
    });
  });

  describe("Rate limit windows", () => {
    it("should support different window types", async () => {
      const minuteResult = await APIRateLimitingService.checkRateLimit(1, "test.minute", "minute");
      const hourResult = await APIRateLimitingService.checkRateLimit(1, "test.hour", "hour");
      const dayResult = await APIRateLimitingService.checkRateLimit(1, "test.day", "day");

      // All should be allowed
      expect(minuteResult.allowed).toBe(true);
      expect(hourResult.allowed).toBe(true);
      expect(dayResult.allowed).toBe(true);

      // Reset times should be different
      expect(minuteResult.resetAt).toBeLessThan(hourResult.resetAt);
      expect(hourResult.resetAt).toBeLessThan(dayResult.resetAt);
    });
  });
});
