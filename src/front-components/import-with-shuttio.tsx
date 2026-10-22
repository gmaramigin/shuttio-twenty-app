import { defineFrontComponent } from 'twenty-sdk/define';
import { MainButton } from 'twenty-ui/components/input';
import { IconExternalLink } from 'twenty-ui/icon';
import { useTheme } from 'twenty-ui/theme';
import { Heading, Text } from 'twenty-ui/primitives/typography';

import {
  IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  SHUTTIO_IMPORT_URL,
} from 'src/constants/universal-identifiers';

const ImportWithShuttio = () => {
  const theme = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: theme.spacing['3'],
        padding: theme.spacing['4'],
      }}
    >
      <Heading level={2} size="md">
        Import data with Shuttio
      </Heading>
      <Text>
        Move companies, people, deals, custom objects, notes and tasks from
        HubSpot, Pipedrive, Affinity, Attio or a CSV file into this workspace.
      </Text>
      <Text>
        Shuttio opens in a new tab with Twenty chosen as the destination. You
        connect the source and this workspace there, review the field mapping
        and check a free sample before the full migration.
      </Text>
      <MainButton
        href={SHUTTIO_IMPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<IconExternalLink size={16} />}
      >
        Open Shuttio
      </MainButton>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'import-with-shuttio',
  description: 'Opens Shuttio with Twenty chosen as the destination',
  component: ImportWithShuttio,
});
