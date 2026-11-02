import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// The SDK finds each entity by parsing its file as plain TypeScript (not TSX) and looking for
// `export default define…()`. A template literal inside JSX derails that parse, and the
// component silently drops out of the manifest.
const dir = join(__dirname, '..', 'front-components');

describe('front components are found by the manifest build', () => {
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.tsx'))) {
    it(file, () => {
      const source = ts.createSourceFile('temp.ts', readFileSync(join(dir, file), 'utf8'), ts.ScriptTarget.Latest, true);
      const found = source.statements.some(
        (node) => ts.isExportAssignment(node) && !node.isExportEquals,
      );
      expect(found).toBe(true);
    });
  }
});
