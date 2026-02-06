import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface ValidationRuleUpdate {
  type: 'validation_rule_created' | 'validation_rule_updated' | 'validation_rule_deleted' | 'validation_rules_sync';
  ruleId?: number;
  rule?: any;
  rules?: any[];
  changes?: any;
  timestamp: string;
}

/**
 * Hook to listen for validation rule updates via WebSocket
 * Triggers callback when rules are created, updated, deleted, or synced
 */
export function useValidationRuleSync(
  onRuleUpdate?: (update: ValidationRuleUpdate) => void,
  onRulesSync?: (rules: any[]) => void
) {
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message.type) return;

    if (message.type === 'validation_rule_created') {
      console.log('[ValidationRuleSync] Rule created:', message.rule);
      onRuleUpdate?.(message);
    } else if (message.type === 'validation_rule_updated') {
      console.log('[ValidationRuleSync] Rule updated:', message.ruleId, message.changes);
      onRuleUpdate?.(message);
    } else if (message.type === 'validation_rule_deleted') {
      console.log('[ValidationRuleSync] Rule deleted:', message.ruleId);
      onRuleUpdate?.(message);
    } else if (message.type === 'validation_rules_sync') {
      console.log('[ValidationRuleSync] Rules synced:', message.rules?.length, 'rules');
      onRulesSync?.(message.rules || []);
      onRuleUpdate?.(message);
    }
  }, [onRuleUpdate, onRulesSync]);

  // Use WebSocket hook to listen for messages
  useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  return {
    isConnected: true, // WebSocket connection status
  };
}
