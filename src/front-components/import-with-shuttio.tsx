import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineFrontComponent } from 'twenty-sdk/define';
import { AppPath, Command, enqueueSnackbar, navigate } from 'twenty-sdk/front-component';

import {
  IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_NAME,
} from 'src/constants/universal-identifiers';

// The page's route takes the page layout's id in this workspace, not its
// universal identifier, so look it up first.
const findImportPageId = async (): Promise<string | null> => {
  const result = await new MetadataApiClient().query({
    getPageLayouts: {
      __args: { pageLayoutType: 'STANDALONE_PAGE' },
      id: true,
      universalIdentifier: true,
    },
  });
  return (
    result.getPageLayouts?.find(
      (layout: { universalIdentifier: string }) =>
        layout.universalIdentifier === IMPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
    )?.id ?? null
  );
};

const OpenImportPage = () => {
  const execute = async () => {
    try {
      const pageLayoutId = await findImportPageId();
      if (pageLayoutId) {
        await navigate(AppPath.PageLayoutPage, { pageLayoutId });
        return;
      }
    } catch {
      // Fall through to the hint below.
    }
    await enqueueSnackbar({
      message: `Open “${IMPORT_PAGE_NAME}” in the left menu`,
      variant: 'info',
    });
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: IMPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'import-with-shuttio',
  description: 'Opens the Import with Shuttio page',
  isHeadless: true,
  component: OpenImportPage,
});
