import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

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
});
