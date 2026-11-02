import { describe, expect, it } from 'vitest';

import type { MappingObject } from 'src/shuttio-api/contract';
import { mergeServerMapping, needsFields, saveBodyOf } from 'src/ui/mapping-sync';

const object = (sourceObject: string, over: Partial<MappingObject> = {}): MappingObject => ({
  sourceObject,
  label: sourceObject,
  destinationObject: sourceObject,
  destinationLabel: sourceObject,
  included: false,
  sourceFields: [],
  destinationFields: [],
  mapping: {},
  ...over,
});

const field = (name: string) => ({ name, label: name, type: 'text' });

describe('saveBodyOf', () => {
  it('sends every object with its tick, ticked or not', () => {
    const body = saveBodyOf([
      object('companies', { included: true, sourceFields: [field('name')], mapping: { name: 'name' } }),
      object('tickets', { included: true }),
      object('quotes'),
    ]);
    expect(body.objects).toEqual([
      { sourceObject: 'companies', included: true, mapping: { name: 'name' } },
      { sourceObject: 'tickets', included: true, mapping: {} },
      { sourceObject: 'quotes', included: false, mapping: {} },
    ]);
  });
});

describe('needsFields', () => {
  it('is true while a ticked object has no fields yet', () => {
    expect(needsFields([object('tickets', { included: true })])).toBe(true);
    expect(needsFields([object('tickets')])).toBe(false);
    expect(needsFields([object('people', { included: true, sourceFields: [field('email')] })])).toBe(false);
  });
});

describe('mergeServerMapping', () => {
  it('keeps ticks made while the save was on its way', () => {
    // Shuttio saved tickets; the page ticked quotes meanwhile.
    const server = [
      object('tickets', { included: true, sourceFields: [field('subject')], mapping: { subject: 'new' } }),
      object('quotes'),
    ];
    const local = [object('tickets', { included: true }), object('quotes', { included: true })];
    const merged = mergeServerMapping(server, local);
    expect(merged.map((o) => [o.sourceObject, o.included])).toEqual([
      ['tickets', true],
      ['quotes', true],
    ]);
    expect(merged[0].sourceFields).toHaveLength(1);
    expect(merged[0].mapping).toEqual({ subject: 'new' });
  });

  it('keeps field choices made on the page, only for fields Shuttio knows', () => {
    const server = [object('people', { included: true, sourceFields: [field('email')], mapping: { email: 'emails' } })];
    const local = [object('people', { included: true, sourceFields: [field('email')], mapping: { email: null, gone: 'x' } })];
    expect(mergeServerMapping(server, local)[0].mapping).toEqual({ email: null });
  });

  it('takes the server answer when the page has nothing', () => {
    const server = [object('people', { included: true })];
    expect(mergeServerMapping(server, null)).toBe(server);
  });
});
