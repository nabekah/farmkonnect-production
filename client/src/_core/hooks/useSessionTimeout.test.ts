import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSessionTimeout } from "./useSessionTimeout";

// Mock the useAuth hook
vi.mock("./useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("useSessionTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should set timeout when user is authenticated", () => {
    const { useAuth } = require("./useAuth");
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: { id: "1", email: "test@example.com", name: "Test User" },
      logout: mockLogout,
    });

    renderHook(() => useSessionTimeout());

    // Fast-forward 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(mockLogout).toHaveBeenCalled();
  });

  it("should show warning 2 minutes before timeout", () => {
    const { useAuth } = require("./useAuth");
    const mockLogout = vi.fn();
    const eventSpy = vi.spyOn(window, "dispatchEvent");

    useAuth.mockReturnValue({
      user: { id: "1", email: "test@example.com", name: "Test User" },
      logout: mockLogout,
    });

    renderHook(() => useSessionTimeout());

    // Fast-forward 28 minutes (2 minutes before timeout)
    vi.advanceTimersByTime(28 * 60 * 1000);

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sessionWarning",
      })
    );

    eventSpy.mockRestore();
  });

  it("should reset timeout on user activity", () => {
    const { useAuth } = require("./useAuth");
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: { id: "1", email: "test@example.com", name: "Test User" },
      logout: mockLogout,
    });

    renderHook(() => useSessionTimeout());

    // Simulate user activity after 15 minutes
    vi.advanceTimersByTime(15 * 60 * 1000);
    window.dispatchEvent(new MouseEvent("mousedown"));

    // Fast-forward another 25 minutes (total 40 minutes, but timeout should reset)
    vi.advanceTimersByTime(25 * 60 * 1000);

    // Logout should not have been called yet (timeout was reset)
    expect(mockLogout).not.toHaveBeenCalled();

    // Fast-forward another 5 minutes (now 30 minutes from last activity)
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(mockLogout).toHaveBeenCalled();
  });

  it("should not set timeout when user is not authenticated", () => {
    const { useAuth } = require("./useAuth");
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    renderHook(() => useSessionTimeout());

    // Fast-forward 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("should clean up timeouts on unmount", () => {
    const { useAuth } = require("./useAuth");
    const mockLogout = vi.fn();

    useAuth.mockReturnValue({
      user: { id: "1", email: "test@example.com", name: "Test User" },
      logout: mockLogout,
    });

    const { unmount } = renderHook(() => useSessionTimeout());

    unmount();

    // Fast-forward 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
