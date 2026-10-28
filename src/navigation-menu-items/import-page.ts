import { defineNavigationMenuItem } from 'twenty-sdk/define';

import {
  IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_NAME,
  IMPORT_PAGE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: IMPORT_PAGE_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  type: 'PAGE_LAYOUT',
  name: IMPORT_PAGE_NAME,
  icon: 'IconTransfer',
  position: 99,
  pageLayoutUniversalIdentifier: IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
