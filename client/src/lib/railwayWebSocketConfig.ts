/**
 * Railway-specific WebSocket configuration
 * Handles WebSocket connection failures gracefully on Railway deployment
 */

export const isRailwayEnvironment = (): boolean => {
  // Check if running on Railway by looking for Railway-specific environment indicators
  const hostname = window.location.hostname;
  const isRailwayDomain = hostname.includes('railway') || 
                          hostname.includes('manus.space') ||
                          hostname.includes('farmconnekt.com');
  
  return isRailwayDomain;
};

export const RAILWAY_WEBSOCKET_CONFIG = {
  // Disable WebSocket on Railway due to proxy/load balancer issues
  enabled: false,
  
  // Use polling as fallback on Railway
  fallbackPolling: true,
  
  // Polling interval (30 seconds)
  pollingInterval: 30000,
  
  // Don't block UI on WebSocket failure
  blockOnFailure: false,
  
  // Max reconnection attempts before giving up
  maxReconnectAttempts: 3,
  
  // Initial reconnect delay (ms)
  reconnectDelay: 1000,
  
  // Max reconnect delay (ms)
  maxReconnectDelay: 5000,
};

export const getWebSocketConfig = () => {
  if (isRailwayEnvironment()) {
    return RAILWAY_WEBSOCKET_CONFIG;
  }
  
  // Default config for local development
  return {
    enabled: true,
    fallbackPolling: true,
    pollingInterval: 30000,
    blockOnFailure: false,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 10000,
  };
};
