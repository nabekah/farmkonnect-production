import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '1h';
const TOKEN_ALGORITHM = 'HS256';

/**
 * WebSocket Token Router
 * 
 * Handles generation, validation, and management of JWT tokens for WebSocket connections.
 * Tokens are short-lived (1 hour) and include user information for authentication.
 */
export const websocketTokenRouter = router({
  /**
   * Generate a WebSocket token for the authenticated user
   * 
   * This procedure creates a JWT token that can be used to authenticate
   * WebSocket connections. The token includes user information and expires
   * after 1 hour.
   * 
   * Usage:
   * ```typescript
   * const { data } = trpc.websocketToken.getToken.useQuery();
   * const ws = new WebSocket(`wss://example.com/ws?token=${data.token}`);
   * ```
   * 
   * @returns {Object} Token data including JWT token and expiry information
   * @throws {TRPCError} If token generation fails
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Validate user is authenticated
      if (!ctx.user || !ctx.user.id) {
        throw new Error('User not authenticated');
      }

      // Generate JWT token with user information
      const token = jwt.sign(
        {
          // Payload
          userId: ctx.user.id,
          email: ctx.user.email,
          role: ctx.user.role || 'user',
          type: 'websocket' // Token type identifier for validation
        },
        JWT_SECRET,
        {
          // Options
          algorithm: TOKEN_ALGORITHM,
          expiresIn: TOKEN_EXPIRY,
          issuer: 'farmkonnect',
          subject: ctx.user.id.toString(),
          notBefore: '0s' // Token is valid immediately
        }
      );

      console.log(
        `[WebSocket Token] Generated token for user ${ctx.user.id} (${ctx.user.email})`
      );

      return {
        success: true,
        token,
        expiresIn: TOKEN_EXPIRY,
        userId: ctx.user.id,
        email: ctx.user.email,
        message: 'WebSocket token generated successfully'
      };
    } catch (error) {
      console.error('[WebSocket Token] Generation failed:', error);
      throw new Error(
        `Failed to generate WebSocket token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Verify a WebSocket token (for debugging and testing)
   * 
   * This procedure verifies the validity of a WebSocket token without
   * establishing a connection. Useful for debugging token issues.
   * 
   * Usage:
   * ```typescript
   * const { data } = trpc.websocketToken.verifyToken.useMutation();
   * const result = await data({ token: myToken });
   * ```
   * 
   * @param {string} token - The JWT token to verify
   * @returns {Object} Verification result with decoded token data
   */
  verifyToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required')
      })
    )
    .query(({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET, {
          algorithms: [TOKEN_ALGORITHM]
        }) as any;

        // Validate token type
        if (decoded.type !== 'websocket') {
          return {
            valid: false,
            decoded: null,
            error: 'Invalid token type. Expected "websocket" token.'
          };
        }

        console.log(`[WebSocket Token] Verified token for user ${decoded.userId}`);

        return {
          valid: true,
          decoded: {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            type: decoded.type,
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000)
          },
          message: 'Token is valid'
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[WebSocket Token] Verification failed:', errorMessage);

        return {
          valid: false,
          decoded: null,
          error: errorMessage
        };
      }
    }),

  /**
   * Refresh a WebSocket token
   * 
   * Generates a new token for the authenticated user, useful when
   * the current token is about to expire.
   * 
   * Usage:
   * ```typescript
   * const { data } = trpc.websocketToken.refreshToken.useMutation();
   * const newToken = await data();
   * ```
   * 
   * @returns {Object} New token data
   */
  refreshToken: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user || !ctx.user.id) {
        throw new Error('User not authenticated');
      }

      // Generate new token
      const token = jwt.sign(
        {
          userId: ctx.user.id,
          email: ctx.user.email,
          role: ctx.user.role || 'user',
          type: 'websocket'
        },
        JWT_SECRET,
        {
          algorithm: TOKEN_ALGORITHM,
          expiresIn: TOKEN_EXPIRY,
          issuer: 'farmkonnect',
          subject: ctx.user.id.toString()
        }
      );

      console.log(
        `[WebSocket Token] Refreshed token for user ${ctx.user.id} (${ctx.user.email})`
      );

      return {
        success: true,
        token,
        expiresIn: TOKEN_EXPIRY,
        userId: ctx.user.id,
        message: 'WebSocket token refreshed successfully'
      };
    } catch (error) {
      console.error('[WebSocket Token] Refresh failed:', error);
      throw new Error(
        `Failed to refresh WebSocket token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Get token information without generating a new one
   * 
   * Returns information about the current token for the user,
   * including when it will expire.
   * 
   * Usage:
   * ```typescript
   * const { data } = trpc.websocketToken.getTokenInfo.useQuery();
   * ```
   * 
   * @returns {Object} Token information
   */
  getTokenInfo: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user || !ctx.user.id) {
        throw new Error('User not authenticated');
      }

      // Calculate expiry time
      const expirySeconds = 60 * 60; // 1 hour in seconds
      const expiresAt = new Date(Date.now() + expirySeconds * 1000);

      return {
        success: true,
        userId: ctx.user.id,
        email: ctx.user.email,
        role: ctx.user.role || 'user',
        expiresIn: TOKEN_EXPIRY,
        expiresAt,
        refreshInterval: 50 * 60 * 1000, // Refresh 50 minutes (before 1 hour expiry)
        message: 'Token information retrieved successfully'
      };
    } catch (error) {
      console.error('[WebSocket Token] Get info failed:', error);
      throw new Error(
        `Failed to get token information: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })
});

/**
 * Utility function to verify WebSocket token (used by WebSocket server)
 * 
 * This function is exported for use by the WebSocket server to validate
 * tokens received from clients.
 * 
 * @param {string} token - The JWT token to verify
 * @returns {Object} Decoded token data if valid
 * @throws {Error} If token is invalid or expired
 */
export function verifyWebSocketToken(token: string): {
  userId: number;
  email: string;
  role: string;
  type: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM]
    }) as any;

    // Validate token type
    if (decoded.type !== 'websocket') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Token verification failed: ${errorMessage}`);
  }
}

/**
 * Utility function to decode token without verification
 * 
 * Useful for extracting token information without verifying the signature.
 * Use with caution - only for debugging or when signature verification
 * is not required.
 * 
 * @param {string} token - The JWT token to decode
 * @returns {Object} Decoded token data
 */
export function decodeWebSocketToken(token: string): any {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error('Failed to decode token');
  }
}

export type WebsocketTokenRouter = typeof websocketTokenRouter;
