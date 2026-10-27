import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  IMPORT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import * as identifiers from 'src/constants/universal-identifiers';
import { describe, expect, it } from 'vitest';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('application identifiers', () => {
  it('should expose the application metadata constants', () => {
    expect(APP_DISPLAY_NAME).toBe('Shuttio');
    expect(typeof APP_DESCRIPTION).toBe('string');
  });

  it('keeps the identifiers published in 1.x', () => {
    expect(APPLICATION_UNIVERSAL_IDENTIFIER).toBe('ec2186f5-bd22-4817-ba34-09453cb26edf');
    expect(DEFAULT_ROLE_UNIVERSAL_IDENTIFIER).toBe('c24420b8-062e-4cee-bb33-253c8e05a1aa');
    expect(IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER).toBe('c2f7bbb8-877e-493e-b3e5-4fde4e87acd0');
    expect(IMPORT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER).toBe('d16df6fc-db74-4c68-85db-795eedbe9a55');
  });

  it('uses unique v4 UUIDs for every entity', () => {
    const ids = Object.entries(identifiers)
      .filter(([name]) => name.endsWith('_UNIVERSAL_IDENTIFIER'))
      .map(([, value]) => value as string);
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
