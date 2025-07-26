import { describe, it, expect, vi } from 'vitest';
import { generateUniqueId } from '../api-utils';

describe('ID Generation Fix', () => {
  it('should generate unique IDs even in rapid succession', () => {
    const ids = new Set<string>();
    const count = 1000;
    
    // Generate many IDs rapidly
    for (let i = 0; i < count; i++) {
      const id = generateUniqueId('test');
      expect(ids.has(id)).toBe(false); // Should not have duplicates
      ids.add(id);
    }
    
    expect(ids.size).toBe(count);
  });

  it('should generate IDs with proper format', () => {
    const id = generateUniqueId('job');
    
    // Should have format: prefix_timestamp_counter_random[_processId]
    const parts = id.split('_');
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts[0]).toBe('job');
    expect(parseInt(parts[1])).toBeGreaterThan(0); // timestamp
    expect(parts[2]).toBeTruthy(); // counter
    expect(parts[3]).toBeTruthy(); // random
  });

  it('should handle concurrent ID generation', async () => {
    const promises = Array.from({ length: 100 }, () => 
      Promise.resolve(generateUniqueId('concurrent'))
    );
    
    const ids = await Promise.all(promises);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should generate different IDs with same prefix', () => {
    const id1 = generateUniqueId('same');
    const id2 = generateUniqueId('same');
    
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('same_')).toBe(true);
    expect(id2.startsWith('same_')).toBe(true);
  });

  it('should handle empty prefix', () => {
    const id = generateUniqueId('');
    expect(id.startsWith('_')).toBe(true);
    expect(id.length).toBeGreaterThan(1);
  });

  it('should include process ID when available', () => {
    // Mock process.pid
    const originalProcess = global.process;
    global.process = { ...global.process, pid: 12345 } as any;
    
    const id = generateUniqueId('test');
    expect(id).toContain('9ix'); // 12345 in base36
    
    // Restore original process
    global.process = originalProcess;
  });
});