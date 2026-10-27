import { definePageLayout } from 'twenty-sdk/define';

import {
  IMPORT_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_NAME,
  IMPORT_PAGE_TAB_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: IMPORT_PAGE_NAME,
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: IMPORT_PAGE_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Import',
      position: 0,
      layoutMode: 'VERTICAL_LIST',
      widgets: [
        {
          universalIdentifier: IMPORT_PAGE_WIDGET_UNIVERSAL_IDENTIFIER,
          title: IMPORT_PAGE_NAME,
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: IMPORT_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
