import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../config.js';

function writeTempConfig(obj: unknown): string {
  const filePath = join(tmpdir(), `proxy-config-test-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(obj));
  return filePath;
}

describe('loadConfig', () => {
  it('parses a valid config file with required fields only', () => {
    const filePath = writeTempConfig({
      targetUrl: 'http://localhost:3000',
      proxyPort: 4000,
    });
    const result = loadConfig(filePath);
    expect(result.targetUrl).toBe('http://localhost:3000');
    expect(result.proxyPort).toBe(4000);
    expect(result.level).toBe('safe');         // default
    expect(result.writeGuardAck).toBe(false);  // default
    expect(result.openApiSpecPath).toBeUndefined();
  });

  it('rejects a config file missing targetUrl', () => {
    const filePath = writeTempConfig({ proxyPort: 4000 });
    expect(() => loadConfig(filePath)).toThrow();
  });

  it('rejects a config file missing proxyPort', () => {
    const filePath = writeTempConfig({ targetUrl: 'http://localhost:3000' });
    expect(() => loadConfig(filePath)).toThrow();
  });

  it('rejects a targetUrl that is not a valid URL', () => {
    const filePath = writeTempConfig({ targetUrl: 'not-a-url', proxyPort: 4000 });
    expect(() => loadConfig(filePath)).toThrow();
  });

  it('rejects an unknown level value', () => {
    const filePath = writeTempConfig({
      targetUrl: 'http://localhost:3000',
      proxyPort: 4000,
      level: 'ultra',
    });
    expect(() => loadConfig(filePath)).toThrow();
  });

  it('accepts level: aggressive with writeGuardAck: true', () => {
    const filePath = writeTempConfig({
      targetUrl: 'http://localhost:3000',
      proxyPort: 4000,
      level: 'aggressive',
      writeGuardAck: true,
    });
    const result = loadConfig(filePath);
    expect(result.level).toBe('aggressive');
    expect(result.writeGuardAck).toBe(true);
  });

  it('accepts an optional openApiSpecPath', () => {
    const filePath = writeTempConfig({
      targetUrl: 'http://localhost:3000',
      proxyPort: 4000,
      openApiSpecPath: './openapi.json',
    });
    const result = loadConfig(filePath);
    expect(result.openApiSpecPath).toBe('./openapi.json');
  });

  it('throws if the file does not exist', () => {
    expect(() => loadConfig('/nonexistent/path/config.json')).toThrow();
  });
});
