import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  SHUTTIO_IMPORT_URL,
} from 'src/constants/universal-identifiers';
import { describe, expect, it } from 'vitest';

describe('application identifiers', () => {
  it('should expose the application metadata constants', () => {
    expect(APP_DISPLAY_NAME).toBe('Shuttio');
    expect(typeof APP_DESCRIPTION).toBe('string');
    expect(APPLICATION_UNIVERSAL_IDENTIFIER).toBeTruthy();
  });

  it('opens Shuttio with Twenty as the destination', () => {
    const url = new URL(SHUTTIO_IMPORT_URL);
    expect(url.origin).toBe('https://www.shuttio.com');
    expect(url.pathname).toBe('/intake');
    expect(url.searchParams.get('to')).toBe('twenty');
  });
});
