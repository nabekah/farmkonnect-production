import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRememberMe, setRememberMe, getRememberMe, getSavedUserEmail } from "./useRememberMe";

// Mock the useAuth hook
vi.mock("./useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("useRememberMe", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("useRememberMe hook", () => {
    it("should save user email when logged in and remember me is enabled", () => {
      const { useAuth } = require("./useAuth");
      const testUser = { id: "1", email: "test@example.com", name: "Test User" };

      useAuth.mockReturnValue({
        user: testUser,
      });

      // Enable remember me
      setRememberMe(true);

      renderHook(() => useRememberMe());

      expect(localStorage.getItem("farmkonnect_user_email")).toBe("test@example.com");
    });

    it("should not save user email when remember me is disabled", () => {
      const { useAuth } = require("./useAuth");
      const testUser = { id: "1", email: "test@example.com", name: "Test User" };

      useAuth.mockReturnValue({
        user: testUser,
      });

      // Don't enable remember me
      setRememberMe(false);

      renderHook(() => useRememberMe());

      expect(localStorage.getItem("farmkonnect_user_email")).toBeNull();
    });

    it("should clear user email on logout when remember me is disabled", () => {
      const { useAuth } = require("./useAuth");

      // First render with user
      useAuth.mockReturnValue({
        user: { id: "1", email: "test@example.com", name: "Test User" },
      });

      localStorage.setItem("farmkonnect_user_email", "test@example.com");

      // Then render without user (logout)
      useAuth.mockReturnValue({
        user: null,
      });

      renderHook(() => useRememberMe());

      expect(localStorage.getItem("farmkonnect_user_email")).toBeNull();
    });

    it("should keep user email on logout when remember me is enabled", () => {
      const { useAuth } = require("./useAuth");

      // Enable remember me
      setRememberMe(true);

      // First render with user
      useAuth.mockReturnValue({
        user: { id: "1", email: "test@example.com", name: "Test User" },
      });

      localStorage.setItem("farmkonnect_user_email", "test@example.com");

      // Then render without user (logout)
      useAuth.mockReturnValue({
        user: null,
      });

      renderHook(() => useRememberMe());

      expect(localStorage.getItem("farmkonnect_user_email")).toBe("test@example.com");
    });
  });

  describe("setRememberMe", () => {
    it("should enable remember me", () => {
      setRememberMe(true);
      expect(getRememberMe()).toBe(true);
    });

    it("should disable remember me and clear saved email", () => {
      localStorage.setItem("farmkonnect_remember_me", "true");
      localStorage.setItem("farmkonnect_user_email", "test@example.com");

      setRememberMe(false);

      expect(getRememberMe()).toBe(false);
      expect(localStorage.getItem("farmkonnect_user_email")).toBeNull();
    });
  });

  describe("getRememberMe", () => {
    it("should return true when remember me is enabled", () => {
      localStorage.setItem("farmkonnect_remember_me", "true");
      expect(getRememberMe()).toBe(true);
    });

    it("should return false when remember me is not set", () => {
      expect(getRememberMe()).toBe(false);
    });
  });

  describe("getSavedUserEmail", () => {
    it("should return saved user email", () => {
      localStorage.setItem("farmkonnect_user_email", "test@example.com");
      expect(getSavedUserEmail()).toBe("test@example.com");
    });

    it("should return null when no email is saved", () => {
      expect(getSavedUserEmail()).toBeNull();
    });
  });
});
