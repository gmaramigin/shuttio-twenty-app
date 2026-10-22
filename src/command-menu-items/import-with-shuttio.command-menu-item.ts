import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  IMPORT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: IMPORT_COMMAND_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  label: 'Import data with Shuttio',
  shortLabel: 'Import with Shuttio',
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier: IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
