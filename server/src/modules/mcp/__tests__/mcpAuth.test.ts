import { describe, it, expect } from 'vitest';
import { hashMcpKey, generateMcpRawKey } from '../mcpAuth.js';

describe('MCP Authentication Utilities', () => {
  it('generates raw key with as_live_ prefix and matching keyPrefix', () => {
    const { rawKey, keyPrefix, hashedKey } = generateMcpRawKey();

    expect(rawKey.startsWith('as_live_')).toBe(true);
    expect(keyPrefix.startsWith('as_live_')).toBe(true);
    expect(keyPrefix.length).toBe(14);
    expect(rawKey.startsWith(keyPrefix)).toBe(true);
    expect(hashedKey).toHaveLength(64); // SHA-256 hex string
  });

  it('deterministically hashes the key using SHA-256', () => {
    const key = 'as_live_testkey1234567890abcdef';
    const hash1 = hashMcpKey(key);
    const hash2 = hashMcpKey(key);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('produces completely different hashes for different keys', () => {
    const hash1 = hashMcpKey('as_live_key_one');
    const hash2 = hashMcpKey('as_live_key_two');

    expect(hash1).not.toBe(hash2);
  });
});
