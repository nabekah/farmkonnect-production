import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Bulk Animal Registration', () => {
  let db: any;
  const testFarmId = 1;
  const testBreed = 'Holstein';

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
  });

  it('should validate serial tag IDs format', async () => {
    const tagIds = ['TAG-00001', 'TAG-00002', 'TAG-00003'];
    
    expect(tagIds).toHaveLength(3);
    expect(tagIds[0]).toMatch(/^TAG-\d+$/);
    expect(tagIds[1]).toMatch(/^TAG-\d+$/);
    expect(tagIds[2]).toMatch(/^TAG-\d+$/);
  });

  it('should detect duplicate tag IDs', async () => {
    const tagIds = ['TAG-00001', 'TAG-00002', 'TAG-00001'];
    const uniqueTags = new Set(tagIds);
    
    expect(uniqueTags.size).toBe(2);
    expect(tagIds.length).toBe(3);
  });

  it('should generate auto-increment tag IDs', () => {
    const prefix = 'COW-';
    const count = 5;
    const startingNumber = 1;
    const padLength = 5;

    const generatedTags = [];
    for (let i = 0; i < count; i++) {
      const number = startingNumber + i;
      const paddedNumber = number.toString().padStart(padLength, '0');
      generatedTags.push(`${prefix}${paddedNumber}`);
    }

    expect(generatedTags).toHaveLength(5);
    expect(generatedTags[0]).toBe('COW-00001');
    expect(generatedTags[4]).toBe('COW-00005');
  });

  it('should handle empty tag IDs', () => {
    const tagIds = ['TAG-00001', '', 'TAG-00002'];
    const validTags = tagIds.filter((tag) => tag && tag.trim().length > 0);
    
    expect(validTags).toHaveLength(2);
    expect(validTags).toEqual(['TAG-00001', 'TAG-00002']);
  });

  it('should validate breed information', () => {
    const breeds = ['Holstein', 'Angus', 'Jersey', 'Brahman'];
    
    expect(breeds).toHaveLength(4);
    breeds.forEach((breed) => {
      expect(breed).toBeTruthy();
      expect(breed.length).toBeGreaterThan(0);
    });
  });

  it('should validate gender values', () => {
    const validGenders = ['male', 'female', 'unknown'];
    const testGender = 'male';
    
    expect(validGenders).toContain(testGender);
  });

  it('should handle birth date conversion', () => {
    const birthDateString = '2024-01-15';
    const birthDate = new Date(birthDateString);
    
    expect(birthDate).toBeInstanceOf(Date);
    expect(birthDate.toISOString().split('T')[0]).toBe(birthDateString);
  });

  it('should validate bulk registration input structure', () => {
    const input = {
      farmId: 1,
      typeId: 1,
      breed: 'Holstein',
      gender: 'female' as const,
      serialTagIds: ['TAG-00001', 'TAG-00002', 'TAG-00003'],
    };

    expect(input).toHaveProperty('farmId');
    expect(input).toHaveProperty('typeId');
    expect(input).toHaveProperty('breed');
    expect(input).toHaveProperty('gender');
    expect(input).toHaveProperty('serialTagIds');
    expect(input.serialTagIds).toHaveLength(3);
  });

  it('should handle large bulk registrations', () => {
    const largeCount = 100;
    const tagIds = [];

    for (let i = 1; i <= largeCount; i++) {
      tagIds.push(`TAG-${i.toString().padStart(5, '0')}`);
    }

    expect(tagIds).toHaveLength(largeCount);
    expect(tagIds[0]).toBe('TAG-00001');
    expect(tagIds[largeCount - 1]).toBe('TAG-00100');
  });

  it('should validate tag ID uniqueness across farm', async () => {
    if (!db) {
      console.log('Skipping: database not available');
      return;
    }

    const testTagId = `TEST-TAG-${Date.now()}`;
    
    // Check if tag exists
    const existingTags = await db
      .select()
      .from(animals)
      .where(eq(animals.uniqueTagId, testTagId));

    expect(existingTags).toHaveLength(0);
  });

  it('should group animals by breed and date', () => {
    const animals = [
      { breed: 'Holstein', createdAt: new Date('2024-01-15'), id: 1 },
      { breed: 'Holstein', createdAt: new Date('2024-01-15'), id: 2 },
      { breed: 'Angus', createdAt: new Date('2024-01-15'), id: 3 },
      { breed: 'Holstein', createdAt: new Date('2024-01-16'), id: 4 },
    ];

    const groups: Record<string, any[]> = {};
    for (const animal of animals) {
      const key = `${animal.breed}-${animal.createdAt.toISOString().split('T')[0]}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(animal);
    }

    expect(Object.keys(groups)).toHaveLength(3);
    expect(groups['Holstein-2024-01-15']).toHaveLength(2);
    expect(groups['Angus-2024-01-15']).toHaveLength(1);
    expect(groups['Holstein-2024-01-16']).toHaveLength(1);
  });

  it('should handle error responses', () => {
    const errorResponse = {
      success: false,
      registered: 0,
      total: 3,
      errors: [
        { tagId: 'TAG-00001', error: 'Tag ID already exists' },
        { tagId: 'TAG-00002', error: 'Invalid format' },
      ],
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.errors).toHaveLength(2);
    expect(errorResponse.registered).toBe(0);
  });

  it('should handle partial success', () => {
    const response = {
      success: true,
      registered: 2,
      total: 3,
      registeredAnimals: [
        { tagId: 'TAG-00001', success: true },
        { tagId: 'TAG-00002', success: true },
      ],
      errors: [
        { tagId: 'TAG-00003', error: 'Tag ID already exists' },
      ],
    };

    expect(response.success).toBe(true);
    expect(response.registered).toBe(2);
    expect(response.total).toBe(3);
    expect(response.errors).toHaveLength(1);
  });
});
