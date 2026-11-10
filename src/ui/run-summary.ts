import type { MigrationDetail, ObjectProgress } from 'src/shuttio-api/contract';

// A warning asks the user to do something when it names a step they can take.
const ACTION_PATTERN = /pick another field|switch it off|add those people|then run again/i;

export const isActionWarning = (warning: string) => ACTION_PATTERN.test(warning);

export const splitWarnings = (warnings: string[] = []) => ({
  action: warnings.filter(isActionWarning),
  info: warnings.filter((warning) => !isActionWarning(warning)),
});

// Objects with nothing to move say nothing; they stay out of the list.
export const visibleObjects = (objects: ObjectProgress[]) =>
  objects.filter((object) => object.done > 0 || object.failed > 0 || (object.total ?? 0) > 0);

export const totals = (detail: Pick<MigrationDetail, 'objects'>) =>
  detail.objects.reduce(
    (sum, object) => ({
      done: sum.done + object.done,
      failed: sum.failed + object.failed,
      total: sum.total + (object.total ?? object.done + object.failed),
    }),
    { done: 0, failed: 0, total: 0 },
  );

const count = (value: number) => value.toLocaleString('en-US');
const plural = (value: number, one: string, many: string) => `${count(value)} ${value === 1 ? one : many}`;

export const summaryLine = (detail: Pick<MigrationDetail, 'objects'>) => {
  const { done, failed, total } = totals(detail);
  const objects = visibleObjects(detail.objects).length;
  const parts = [`${plural(done, 'record', 'records')} imported across ${plural(objects, 'object', 'objects')}`];
  if (failed > 0) parts.push(`${count(failed)} failed`);
  const missing = total - done - failed;
  if (missing > 0) parts.push(`${count(missing)} not processed`);
  return parts.join(' · ');
};
