// How the import page keeps the object ticks and field choices in step with Shuttio. Pure, so the
// rules are tested apart from the page.
import type { MappingObject, SaveMappingRequest } from 'src/shuttio-api/contract';

// The PUT body: every object with its tick and its fields, from the page's latest state.
export const saveBodyOf = (objects: MappingObject[]): SaveMappingRequest => ({
  objects: objects.map((object) => ({
    sourceObject: object.sourceObject,
    included: object.included,
    mapping: object.mapping,
  })),
});

// A ticked object Shuttio sent no fields for: its fields arrive after the tick is saved.
export const needsFields = (objects: MappingObject[]) =>
  objects.some((object) => object.included && object.sourceFields.length === 0);

// The mapping Shuttio read back after a save, with the choices made on the page since that save
// left: the page's ticks win, and its field choices win for the fields Shuttio knows.
export const mergeServerMapping = (
  server: MappingObject[],
  local: MappingObject[] | null,
): MappingObject[] => {
  if (!local) return server;
  const byId = new Map(local.map((object) => [object.sourceObject, object]));
  return server.map((object) => {
    const mine = byId.get(object.sourceObject);
    if (!mine) return object;
    const mapping = { ...object.mapping };
    for (const field of Object.keys(mapping)) {
      if (field in mine.mapping) mapping[field] = mine.mapping[field];
    }
    return { ...object, included: mine.included, mapping };
  });
};
