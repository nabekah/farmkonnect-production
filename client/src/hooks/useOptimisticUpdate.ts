import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T) => T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
}

/**
 * Hook for optimistic UI updates
 * Updates the UI immediately while the mutation is in flight,
 * then rolls back if the mutation fails
 */
export function useOptimisticUpdate<T = any>() {
  const queryClient = useQueryClient();

  const optimisticUpdate = useCallback(
    async (
      options: OptimisticUpdateOptions<T>,
      mutationFn: () => Promise<T>
    ) => {
      const { queryKey, updateFn, onSuccess, onError } = options;

      // Get the current data
      const previousData = queryClient.getQueryData<T>(queryKey);

      try {
        // Optimistically update the UI
        if (previousData) {
          const optimisticData = updateFn(previousData);
          queryClient.setQueryData(queryKey, optimisticData);
        }

        // Execute the mutation
        const result = await mutationFn();

        // Update with the actual result
        queryClient.setQueryData(queryKey, result);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // Rollback to previous data on error
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }

        if (onError && previousData) {
          onError(error as Error, previousData);
        }

        throw error;
      }
    },
    [queryClient]
  );

  return { optimisticUpdate };
}

interface OptimisticMutationOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T, newData: Partial<T>) => T;
}

/**
 * Hook for optimistic mutations with automatic rollback
 */
export function useOptimisticMutation<T = any>(
  options: OptimisticMutationOptions<T>
) {
  const queryClient = useQueryClient();
  const { queryKey, updateFn } = options;

  const mutate = useCallback(
    async (newData: Partial<T>, mutationFn: () => Promise<T>) => {
      const previousData = queryClient.getQueryData<T>(queryKey);

      try {
        // Optimistically update
        if (previousData) {
          const optimisticData = updateFn(previousData, newData);
          queryClient.setQueryData(queryKey, optimisticData);
        }

        // Execute mutation
        const result = await mutationFn();
        queryClient.setQueryData(queryKey, result);

        return result;
      } catch (error) {
        // Rollback
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        throw error;
      }
    },
    [queryClient, queryKey, updateFn]
  );

  return { mutate };
}

/**
 * Hook for optimistic list updates (add, update, delete)
 */
export function useOptimisticListUpdate<T extends { id: string | number }>(
  queryKey: string[]
) {
  const queryClient = useQueryClient();

  const optimisticAdd = useCallback(
    async (newItem: T, mutationFn: () => Promise<T>) => {
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];

      try {
        // Optimistically add to list
        queryClient.setQueryData(queryKey, [...previousData, newItem]);

        // Execute mutation
        const result = await mutationFn();
        queryClient.setQueryData(queryKey, [...previousData, result]);

        return result;
      } catch (error) {
        // Rollback
        queryClient.setQueryData(queryKey, previousData);
        throw error;
      }
    },
    [queryClient, queryKey]
  );

  const optimisticUpdate = useCallback(
    async (id: string | number, updates: Partial<T>, mutationFn: () => Promise<T>) => {
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];

      try {
        // Optimistically update item in list
        const optimisticData = previousData.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        queryClient.setQueryData(queryKey, optimisticData);

        // Execute mutation
        const result = await mutationFn();
        const updatedData = previousData.map(item =>
          item.id === id ? result : item
        );
        queryClient.setQueryData(queryKey, updatedData);

        return result;
      } catch (error) {
        // Rollback
        queryClient.setQueryData(queryKey, previousData);
        throw error;
      }
    },
    [queryClient, queryKey]
  );

  const optimisticDelete = useCallback(
    async (id: string | number, mutationFn: () => Promise<void>) => {
      const previousData = queryClient.getQueryData<T[]>(queryKey) || [];

      try {
        // Optimistically remove from list
        const optimisticData = previousData.filter(item => item.id !== id);
        queryClient.setQueryData(queryKey, optimisticData);

        // Execute mutation
        await mutationFn();

        return;
      } catch (error) {
        // Rollback
        queryClient.setQueryData(queryKey, previousData);
        throw error;
      }
    },
    [queryClient, queryKey]
  );

  return {
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
  };
}
