import { useState } from 'react';
import { Dropdown } from 'twenty-ui/components/navigation';
import { Section } from 'twenty-ui/components/layout';
import { LightIconButton } from 'twenty-ui/components/input';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/icon';
import { Button, Checkbox } from 'twenty-ui/primitives/input';
import { Text } from 'twenty-ui/primitives/typography';
import { useTheme } from 'twenty-ui/theme';

import type { FieldTarget, MappingObject, SourceField } from 'src/shuttio-api/contract';

export const NEW_FIELD = 'new';
const SKIP = '__skip__';

type TargetPickerProps = {
  object: MappingObject;
  field: SourceField;
  sourceLabel: string;
  value: FieldTarget;
  disabled: boolean;
  onChange: (value: FieldTarget) => void;
};

// A link to other records is a link: only "Link to …" or Skip, never a text field.
const isLink = (field: SourceField) => field.type === 'link';
const newLabelOf = (field: SourceField) => field.newLabel ?? 'New field';

const targetLabel = (object: MappingObject, field: SourceField, value: FieldTarget) => {
  if (value === null) return 'Skip';
  if (value === NEW_FIELD) return newLabelOf(field);
  return object.destinationFields.find((field) => field.name === value)?.label ?? value;
};

// The Twenty type of the chosen field, in words: "FULL_NAME" -> "Full name". Nothing for Skip
// or a new field: Shuttio picks the new field's type itself.
const targetType = (object: MappingObject, value: FieldTarget) => {
  if (value === null || value === NEW_FIELD) return null;
  const type = object.destinationFields.find((field) => field.name === value)?.type;
  if (!type) return null;
  const words = type.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Collapsed by default when the list is long.
const MAX_OPEN_OBJECTS = 3;

const TargetPicker = ({ object, field: source, sourceLabel, value, disabled, onChange }: TargetPickerProps) => {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const fields = isLink(source) ? [] : object.destinationFields.filter(
    (field) =>
      needle === '' ||
      field.label.toLowerCase().includes(needle) ||
      field.name.toLowerCase().includes(needle),
  );

  return (
    <Dropdown.Root type="picker" onOpenChange={(open) => !open && setSearch('')}>
      <Dropdown.Trigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            fullWidth
            endIcon={<IconChevronDown size={14} />}
            aria-label={`Destination for ${sourceLabel}: ${targetLabel(object, source, value)}`}
          >
            {targetLabel(object, source, value)}
          </Button>
        }
      />
      <Dropdown.Content aria-label={`Destination for ${sourceLabel}`} width={260}>
        <Dropdown.Search
          aria-label="Search Twenty fields"
          placeholder="Search fields"
          value={search}
          onValueChange={setSearch}
        />
        <Dropdown.Section scrollable>
          <Dropdown.SelectionGroup
            aria-label="Twenty field"
            value={value === null ? SKIP : value}
            onValueChange={(next) => onChange(next === SKIP || next === null ? null : next)}
          >
            <Dropdown.OptionItem value={SKIP}>Skip</Dropdown.OptionItem>
            <Dropdown.OptionItem
              value={NEW_FIELD}
              description={isLink(source) ? 'Links the records in Twenty' : 'Shuttio adds it to Twenty'}
            >
              {newLabelOf(source)}
            </Dropdown.OptionItem>
            {fields.map((field) => (
              <Dropdown.OptionItem key={field.name} value={field.name} description={field.type}>
                {field.label}
              </Dropdown.OptionItem>
            ))}
          </Dropdown.SelectionGroup>
          {fields.length === 0 && needle !== '' && (
            <Dropdown.Empty>No Twenty field matches “{search}”</Dropdown.Empty>
          )}
        </Dropdown.Section>
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

type MappingTableProps = {
  objects: MappingObject[];
  disabled: boolean;
  // Object ticks stay usable while earlier ticks save; they queue.
  ticksDisabled?: boolean;
  onToggleObject: (sourceObject: string, included: boolean) => void;
  onChangeTarget: (sourceObject: string, sourceField: string, target: FieldTarget) => void;
};

export const MappingTable = ({
  objects,
  disabled,
  ticksDisabled,
  onToggleObject,
  onChangeTarget,
}: MappingTableProps) => {
  const theme = useTheme();
  // Decided once from the first answer, so ticking an object does not fold the others.
  const [openByDefault] = useState(
    () => objects.filter((object) => object.included).length <= MAX_OPEN_OBJECTS,
  );
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showEmpty, setShowEmpty] = useState<Record<string, boolean>>({});

  if (objects.length === 0) {
    return <Text>The source returned no objects to import. Check the connection’s access.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['6'] }}>
      {objects.map((object) => {
        const mapped = Object.values(object.mapping).filter((target) => target !== null).length;
        const isOpen = open[object.sourceObject] ?? openByDefault;
        // A field with no values that goes nowhere hides until asked for.
        const hidden = (field: SourceField) =>
          field.empty === true && (object.mapping[field.name] ?? null) === null;
        const emptyCount = object.sourceFields.filter(hidden).length;
        const emptyShown = showEmpty[object.sourceObject] === true;
        const rows = emptyShown
          ? object.sourceFields
          : object.sourceFields.filter((field) => !hidden(field));
        return (
          <Section.Root key={object.sourceObject} fullWidth>
            <Section.Header
              level={3}
              size="sm"
              title={`${object.label} → ${object.destinationLabel}`}
              description={
                object.included
                  ? `${mapped} of ${object.sourceFields.length} fields go to Twenty` +
                    (typeof object.recordCount === 'number'
                      ? ` · ${object.recordCount.toLocaleString('en-US')} records`
                      : '')
                  : object.note ?? 'Not imported'
              }
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}>
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}
                  >
                    <Checkbox
                      checked={object.included}
                      disabled={ticksDisabled ?? disabled}
                      onCheckedChange={(checked) => onToggleObject(object.sourceObject, checked)}
                    />
                    <Text>Import</Text>
                  </label>
                  {object.included && (
                    <LightIconButton
                      size="sm"
                      aria-label={`${isOpen ? 'Hide' : 'Show'} ${object.label} fields`}
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpen((state) => ({ ...state, [object.sourceObject]: !isOpen }))
                      }
                    >
                      {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </LightIconButton>
                  )}
                </div>
              }
            />
            {object.included && isOpen && (
              <div role="table" aria-label={`${object.label} fields`}>
                {rows.map((field) => {
                  const value = object.mapping[field.name] ?? null;
                  const type = targetType(object, value);
                  return (
                    <div
                      role="row"
                      key={field.name}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: theme.spacing['2'],
                        padding: `${theme.spacing['2']} 0`,
                        borderTop: `1px solid ${theme.border.color.light}`,
                      }}
                    >
                      <div role="cell" style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <Text truncate>{field.label}</Text>
                        <Text
                          truncate
                          style={{ color: theme.font.color.tertiary, fontSize: theme.font.size.sm }}
                        >
                          {field.empty
                            ? 'No values in the records Shuttio read'
                            : isLink(field)
                              ? 'Linked record'
                              : field.samples && field.samples.length > 0
                              ? field.samples.join(' · ')
                              : field.type}
                        </Text>
                      </div>
                      <div role="cell" style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <TargetPicker
                          object={object}
                          field={field}
                          sourceLabel={field.label}
                          value={value}
                          disabled={disabled}
                          onChange={(target) =>
                            onChangeTarget(object.sourceObject, field.name, target)
                          }
                        />
                        {type && (
                          <Text
                            truncate
                            style={{ color: theme.font.color.tertiary, fontSize: theme.font.size.sm }}
                          >
                            Twenty type: {type}
                          </Text>
                        )}
                      </div>
                    </div>
                  );
                })}
                {emptyCount > 0 && (
                  <div style={{ paddingTop: theme.spacing['2'], borderTop: `1px solid ${theme.border.color.light}` }}>
                    <Button
                      variant="link"
                      color="neutral"
                      size="sm"
                      onClick={() =>
                        setShowEmpty((state) => ({ ...state, [object.sourceObject]: !emptyShown }))
                      }
                    >
                      {emptyShown
                        ? 'Hide empty fields'
                        : `Show ${emptyCount} empty ${emptyCount === 1 ? 'field' : 'fields'}`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Section.Root>
        );
      })}
    </div>
  );
};
