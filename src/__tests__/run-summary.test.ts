import { describe, expect, it } from 'vitest';

import { needsFieldReview, splitWarnings, summaryLine, visibleObjects } from 'src/ui/run-summary';

const obj = (name: string, done: number, total: number | null, failed = 0) => ({
  name, label: name, done, total, failed, status: 'done',
});

describe('run summary', () => {
  const warnings = [
    '1 record matched one you already had in Twenty. It was linked to, not changed.',
    '42 owner fields left empty: their owners in the source have no Twenty user with the same email. Add those people to Twenty, then run again.',
    'People: "Job title" was left out: ... Pick another field for it on the field review, or switch it off.',
    '1 person link beyond the first on a deal was left out: a Twenty opportunity has one point of contact.',
  ];

  it('splits warnings that ask for action from notes', () => {
    const { action, info } = splitWarnings(warnings);
    expect(action).toHaveLength(2);
    expect(info).toHaveLength(2);
    expect(needsFieldReview(action)).toBe(true);
    expect(needsFieldReview([action[0]])).toBe(false);
  });

  it('hides empty objects and sums records', () => {
    const objects = [obj('Companies', 11, 11), obj('People', 17, 18, 1), obj('Files', 0, 0)];
    expect(visibleObjects(objects).map((o) => o.name)).toEqual(['Companies', 'People']);
    expect(summaryLine({ objects })).toBe('28 records imported across 2 objects · 1 failed');
  });

  it('counts records not processed', () => {
    expect(summaryLine({ objects: [obj('Notes', 1, 3)] })).toBe('1 record imported across 1 object · 2 not processed');
  });
});
