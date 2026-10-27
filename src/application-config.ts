import { defineApplication } from 'twenty-sdk/define';

import { SHUTTIO_DEFAULT_BASE_URL } from 'src/shuttio-api/contract';
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  SHUTTIO_BASE_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  // The owner's HubSpot app, entered once under Settings > Developers > Shuttio >
  // Config. Same values as Shuttio's HUBSPOT_CLIENT_ID / HUBSPOT_CLIENT_SECRET.
  serverVariables: {
    HUBSPOT_CLIENT_ID: {
      description: 'Client ID of the Shuttio HubSpot app',
      isSecret: false,
      isRequired: true,
    },
    HUBSPOT_CLIENT_SECRET: {
      description: 'Client secret of the Shuttio HubSpot app',
      isSecret: true,
      isRequired: true,
    },
  },
  applicationVariables: {
    SHUTTIO_BASE_URL: {
      universalIdentifier: SHUTTIO_BASE_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Shuttio address',
      description: 'Where the import page sends its requests. Only https://*.shuttio.com is accepted.',
      value: SHUTTIO_DEFAULT_BASE_URL,
      isSecret: false,
    },
  },
  author: 'Craftt',
  category: 'Data',
  logo: 'public/logo.png',
  galleryImages: [
    'public/gallery/01.png',
    'public/gallery/02.png',
    'public/gallery/03.png',
  ],
  websiteUrl: 'https://www.shuttio.com',
  termsUrl: 'https://www.shuttio.com/terms',
  emailSupport: 'help@shuttio.com',
  issueReportUrl: 'https://github.com/gmaramigin/shuttio-twenty-app/issues',
});
