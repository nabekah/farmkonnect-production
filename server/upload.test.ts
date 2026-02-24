import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as storage from "./storage";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  })),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "farmer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Upload Router - Profile Picture", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload profile picture successfully", async () => {
    // Mock storage response
    const mockUrl = "https://example.com/profile-pictures/1/123-abc.jpg";
    const mockKey = "profile-pictures/1/123-abc.jpg";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.jpg",
      fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mimeType: "image/jpeg",
    });

    expect(result.url).toBe(mockUrl);
    expect(result.key).toBe(mockKey);
    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringContaining("profile-pictures/1/"),
      expect.any(Buffer),
      "image/jpeg"
    );
  });

  it("should reject invalid file types", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.upload.profilePicture({
        fileName: "document.pdf",
        fileData: "data:application/pdf;base64,JVBERi0x",
        mimeType: "application/pdf",
      })
    ).rejects.toThrow("Only JPEG, PNG, WebP, and GIF images are allowed");
  });

  it("should reject files larger than 5MB", async () => {
    // Create a base64 string that represents a file larger than 5MB
    const largeBase64 = "A".repeat(7 * 1024 * 1024);

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.upload.profilePicture({
        fileName: "large.jpg",
        fileData: largeBase64,
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("File size must be less than 5MB");
  });

  it("should support PNG files", async () => {
    const mockUrl = "https://example.com/profile-pictures/1/456-def.png";
    const mockKey = "profile-pictures/1/456-def.png";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.png",
      fileData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
    });

    expect(result.url).toBe(mockUrl);
    expect(result.key).toBe(mockKey);
  });

  it("should support WebP files", async () => {
    const mockUrl = "https://example.com/profile-pictures/1/789-ghi.webp";
    const mockKey = "profile-pictures/1/789-ghi.webp";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.webp",
      fileData: "data:image/webp;base64,UklGRiYAAABXRUJQ",
      mimeType: "image/webp",
    });

    expect(result.url).toBe(mockUrl);
    expect(result.key).toBe(mockKey);
  });

  it("should support GIF files", async () => {
    const mockUrl = "https://example.com/profile-pictures/1/101-jkl.gif";
    const mockKey = "profile-pictures/1/101-jkl.gif";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.gif",
      fileData: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      mimeType: "image/gif",
    });

    expect(result.url).toBe(mockUrl);
    expect(result.key).toBe(mockKey);
  });

  it("should handle base64 data with data URI prefix", async () => {
    const mockUrl = "https://example.com/profile-pictures/1/202-mno.jpg";
    const mockKey = "profile-pictures/1/202-mno.jpg";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.jpg",
      fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mimeType: "image/jpeg",
    });

    expect(result.url).toBe(mockUrl);
    expect(result.key).toBe(mockKey);
  });

  it("should generate unique file keys for different users", async () => {
    const mockUrl = "https://example.com/profile-pictures/2/303-pqr.jpg";
    const mockKey = "profile-pictures/2/303-pqr.jpg";
    
    vi.mocked(storage.storagePut).mockResolvedValueOnce({
      url: mockUrl,
      key: mockKey,
    });

    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.upload.profilePicture({
      fileName: "profile.jpg",
      fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      mimeType: "image/jpeg",
    });

    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringContaining("profile-pictures/2/"),
      expect.any(Buffer),
      "image/jpeg"
    );
  });
});
