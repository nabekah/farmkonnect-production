import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const uploadRouter = router({
  farmPhoto: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64
        const buffer = Buffer.from(input.fileData, "base64");
        
        // Generate unique key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = input.fileName.split(".").pop();
        const key = `farm-photos/${ctx.user.id}/${timestamp}-${randomStr}.${fileExt}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.mimeType);
        
        return { url: result.url, key: result.key };
      } catch (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to upload photo" 
        });
      }
    }),

  cropHealthPhoto: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64
        const base64Data = input.fileData.includes("base64,") 
          ? input.fileData.split("base64,")[1] 
          : input.fileData;
        const buffer = Buffer.from(base64Data, "base64");
        
        // Generate unique key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = input.fileName.split(".").pop();
        const key = `crop-health/${ctx.user.id}/${timestamp}-${randomStr}.${fileExt}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.mimeType);
        
        return { url: result.url, key: result.key };
      } catch (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to upload photo" 
        });
      }
    }),

  profilePicture: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate file type
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimeTypes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only JPEG, PNG, WebP, and GIF images are allowed",
          });
        }

        // Decode base64
        const base64Data = input.fileData.includes("base64,") 
          ? input.fileData.split("base64,")[1] 
          : input.fileData;
        const buffer = Buffer.from(base64Data, "base64");

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (buffer.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size must be less than 5MB",
          });
        }
        
        // Generate unique key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = input.fileName.split(".").pop();
        const key = `profile-pictures/${ctx.user.id}/${timestamp}-${randomStr}.${fileExt}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.mimeType);
        
        // Update user profile picture in database
        const db = getDb();
        await db.update(users)
          .set({
            profilePictureUrl: result.url,
            profilePictureKey: result.key,
          })
          .where(eq(users.id, ctx.user.id));
        
        return { url: result.url, key: result.key };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to upload profile picture" 
        });
      }
    }),
});
