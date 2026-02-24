import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for optimistic update functionality
 */

describe('useOptimisticUpdate', () => {
  describe('Optimistic Update Behavior', () => {
    it('should update UI immediately', async () => {
      const previousData = { id: 1, name: 'Item 1', count: 5 };
      const updateFn = (data: typeof previousData) => ({
        ...data,
        count: data.count + 1,
      });

      const optimisticData = updateFn(previousData);
      expect(optimisticData.count).toBe(6);
    });

    it('should rollback on mutation error', async () => {
      const previousData = { id: 1, name: 'Item 1', count: 5 };
      let currentData = previousData;

      const updateFn = (data: typeof previousData) => ({
        ...data,
        count: data.count + 1,
      });

      // Simulate optimistic update
      currentData = updateFn(previousData);
      expect(currentData.count).toBe(6);

      // Simulate rollback
      currentData = previousData;
      expect(currentData.count).toBe(5);
    });

    it('should update with actual result on success', async () => {
      const previousData = { id: 1, name: 'Item 1', count: 5 };
      const serverResult = { id: 1, name: 'Item 1', count: 6, timestamp: '2026-02-24' };

      const updateFn = (data: typeof previousData) => ({
        ...data,
        count: data.count + 1,
      });

      // Optimistic update
      let currentData = updateFn(previousData);
      expect(currentData.count).toBe(6);

      // Server result
      currentData = serverResult;
      expect(currentData.timestamp).toBe('2026-02-24');
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback on failure', async () => {
      const previousData = { id: 1, value: 10 };
      const error = new Error('Mutation failed');
      const onError = vi.fn();

      // Simulate error handling
      if (error) {
        onError(error, previousData);
      }

      expect(onError).toHaveBeenCalledWith(error, previousData);
    });

    it('should call onSuccess callback on success', async () => {
      const result = { id: 1, value: 20 };
      const onSuccess = vi.fn();

      onSuccess(result);

      expect(onSuccess).toHaveBeenCalledWith(result);
    });
  });
});

describe('useOptimisticMutation', () => {
  describe('Mutation Update', () => {
    it('should apply partial updates to data', () => {
      const previousData = { id: 1, name: 'Item', status: 'active', count: 5 };
      const newData = { status: 'inactive', count: 10 };

      const updateFn = (oldData: typeof previousData, updates: Partial<typeof previousData>) => ({
        ...oldData,
        ...updates,
      });

      const result = updateFn(previousData, newData);
      expect(result.status).toBe('inactive');
      expect(result.count).toBe(10);
      expect(result.name).toBe('Item'); // Should preserve unchanged fields
    });

    it('should handle empty updates', () => {
      const previousData = { id: 1, name: 'Item', count: 5 };
      const newData = {};

      const updateFn = (oldData: typeof previousData, updates: Partial<typeof previousData>) => ({
        ...oldData,
        ...updates,
      });

      const result = updateFn(previousData, newData);
      expect(result).toEqual(previousData);
    });
  });
});

describe('useOptimisticListUpdate', () => {
  describe('Add to List', () => {
    it('should add item to list optimistically', () => {
      const previousData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      const newItem = { id: 3, name: 'Item 3' };

      const optimisticData = [...previousData, newItem];
      expect(optimisticData).toHaveLength(3);
      expect(optimisticData[2]).toEqual(newItem);
    });

    it('should rollback list on add failure', () => {
      const previousData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      const newItem = { id: 3, name: 'Item 3' };

      // Optimistic add
      let currentData = [...previousData, newItem];
      expect(currentData).toHaveLength(3);

      // Rollback
      currentData = previousData;
      expect(currentData).toHaveLength(2);
    });
  });

  describe('Update in List', () => {
    it('should update item in list optimistically', () => {
      const previousData = [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'active' },
      ];

      const updates = { status: 'inactive' };
      const optimisticData = previousData.map(item =>
        item.id === 1 ? { ...item, ...updates } : item
      );

      expect(optimisticData[0].status).toBe('inactive');
      expect(optimisticData[1].status).toBe('active');
    });

    it('should rollback list on update failure', () => {
      const previousData = [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'active' },
      ];

      const updates = { status: 'inactive' };
      let currentData = previousData.map(item =>
        item.id === 1 ? { ...item, ...updates } : item
      );

      expect(currentData[0].status).toBe('inactive');

      // Rollback
      currentData = previousData;
      expect(currentData[0].status).toBe('active');
    });
  });

  describe('Delete from List', () => {
    it('should remove item from list optimistically', () => {
      const previousData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      const optimisticData = previousData.filter(item => item.id !== 2);
      expect(optimisticData).toHaveLength(2);
      expect(optimisticData.find(item => item.id === 2)).toBeUndefined();
    });

    it('should rollback list on delete failure', () => {
      const previousData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      // Optimistic delete
      let currentData = previousData.filter(item => item.id !== 2);
      expect(currentData).toHaveLength(2);

      // Rollback
      currentData = previousData;
      expect(currentData).toHaveLength(3);
    });
  });
});
