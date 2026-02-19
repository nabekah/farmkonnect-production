import { TRPCError } from "@trpc/server";
import { APIRateLimitingService } from "../services/apiRateLimitingService";

/**
 * tRPC middleware for API rate limiting
 * Checks rate limits before executing procedures
 */
export const rateLimitMiddleware = async (opts: {
  ctx: any;
  path: string;
  type: "query" | "mutation" | "subscription";
  next: () => Promise<any>;
  getRawInput: () => Promise<unknown>;
}) => {
  const { ctx, path, next } = opts;

  // Skip rate limiting for unauthenticated users (public procedures)
  if (!ctx.user) {
    return next();
  }

  // Check rate limit
  const result = await APIRateLimitingService.checkRateLimit(ctx.user.id, path);

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      cause: {
        limit: result.limit,
        resetAt: result.resetAt,
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
    });
  }

  // Add rate limit info to context
  ctx.rateLimit = {
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };

  // Execute the procedure
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const output = await next();
    return output;
  } catch (error: any) {
    // Determine status code from error
    if (error.code === "UNAUTHORIZED") {
      statusCode = 401;
    } else if (error.code === "FORBIDDEN") {
      statusCode = 403;
    } else if (error.code === "NOT_FOUND") {
      statusCode = 404;
    } else if (error.code === "BAD_REQUEST") {
      statusCode = 400;
    } else {
      statusCode = 500;
    }

    throw error;
  } finally {
    // Record API usage
    const responseTime = Date.now() - startTime;
    await APIRateLimitingService.recordUsage(ctx.user.id, path, responseTime, statusCode);
  }
};

/**
 * Middleware to add rate limit headers to response
 */
export const rateLimitHeadersMiddleware = (opts: {
  ctx: any;
  path: string;
  type: "query" | "mutation" | "subscription";
  next: () => Promise<any>;
  getRawInput: () => Promise<unknown>;
}) => {
  const { ctx, next } = opts;

  const output = next();

  // Add rate limit headers if available
  if (ctx.rateLimit) {
    // Note: In a real HTTP context, you would add headers like:
    // X-RateLimit-Limit: ctx.rateLimit.limit
    // X-RateLimit-Remaining: ctx.rateLimit.remaining
    // X-RateLimit-Reset: ctx.rateLimit.resetAt
  }

  return output;
};
