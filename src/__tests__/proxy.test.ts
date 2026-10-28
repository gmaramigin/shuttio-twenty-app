import { describe, expect, it } from 'vitest';

import { isAllowedPath, pathFromParameters, resolveShuttioBaseUrl } from 'src/shuttio-api/proxy';

describe('resolveShuttioBaseUrl', () => {
  it('defaults to www.shuttio.com', () => {
    expect(resolveShuttioBaseUrl(undefined)).toBe('https://www.shuttio.com');
    expect(resolveShuttioBaseUrl('  ')).toBe('https://www.shuttio.com');
  });

  it('accepts Shuttio hosts and localhost only', () => {
    expect(resolveShuttioBaseUrl('https://staging.shuttio.com/x')).toBe('https://staging.shuttio.com');
    expect(resolveShuttioBaseUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(resolveShuttioBaseUrl('https://evil.com')).toBeNull();
    expect(resolveShuttioBaseUrl('https://shuttio.com.evil.com')).toBeNull();
    expect(resolveShuttioBaseUrl('http://www.shuttio.com')).toBeNull();
    expect(resolveShuttioBaseUrl('not a url')).toBeNull();
  });
});

describe('pathFromParameters', () => {
  it('joins wildcard segments', () => {
    expect(pathFromParameters({ path: ['migrations', 'abc', 'mapping'] })).toBe('migrations/abc/mapping');
    expect(pathFromParameters({ path: 'status' })).toBe('status');
    expect(pathFromParameters({ path: 'migrations,abc,mapping' })).toBe('migrations/abc/mapping');
  });

  it('refuses traversal and odd characters', () => {
    expect(pathFromParameters({ path: ['..', 'admin'] })).toBeNull();
    expect(pathFromParameters({ path: ['migrations', 'a?b'] })).toBeNull();
    expect(pathFromParameters({})).toBeNull();
  });
});

describe('isAllowedPath', () => {
  it('allows the documented routes with their methods', () => {
    expect(isAllowedPath('GET', 'status')).toBe(true);
    expect(isAllowedPath('POST', 'migrations')).toBe(true);
    expect(isAllowedPath('GET', 'migrations/m1')).toBe(true);
    expect(isAllowedPath('PUT', 'migrations/m1/mapping')).toBe(true);
    expect(isAllowedPath('POST', 'migrations/m1/rollback')).toBe(true);
  });

  it('refuses anything else', () => {
    expect(isAllowedPath('POST', 'status')).toBe(false);
    expect(isAllowedPath('GET', 'migrations/m1/run')).toBe(false);
    expect(isAllowedPath('POST', 'migrations/m1/delete')).toBe(false);
    expect(isAllowedPath('GET', 'admin')).toBe(false);
  });
});
