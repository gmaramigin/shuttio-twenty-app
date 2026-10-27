import { useState } from 'react';
import { Dropdown } from 'twenty-ui/components/navigation';
import { Section } from 'twenty-ui/components/layout';
import { IconChevronDown } from 'twenty-ui/icon';
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
  onToggleObject: (sourceObject: string, included: boolean) => void;
  onChangeTarget: (sourceObject: string, sourceField: string, target: FieldTarget) => void;
};

export const MappingTable = ({
  objects,
  disabled,
  onToggleObject,
  onChangeTarget,
}: MappingTableProps) => {
  const theme = useTheme();

  if (objects.length === 0) {
    return <Text>The source returned no objects to import. Check the connection’s access.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['6'] }}>
      {objects.map((object) => {
        const mapped = Object.values(object.mapping).filter((target) => target !== null).length;
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
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}
                >
                  <Checkbox
                    checked={object.included}
                    disabled={disabled}
                    onCheckedChange={(checked) => onToggleObject(object.sourceObject, checked)}
                  />
                  <Text>Import</Text>
                </label>
              }
            />
            {object.included && (
              <div role="table" aria-label={`${object.label} fields`}>
                {object.sourceFields.map((field) => (
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
                        value={object.mapping[field.name] ?? null}
                        disabled={disabled}
                        onChange={(target) =>
                          onChangeTarget(object.sourceObject, field.name, target)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section.Root>
        );
      })}
    </div>
  );
};
