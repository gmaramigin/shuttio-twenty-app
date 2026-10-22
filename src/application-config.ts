import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Craftt',
  category: 'Data',
  logo: 'public/logo.png',
  galleryImages: [
    'public/gallery/01.png',
    'public/gallery/02.png',
    'public/gallery/03.png',
    'public/gallery/04.png',
    'public/gallery/05.png',
  ],
  websiteUrl: 'https://www.shuttio.com',
  termsUrl: 'https://www.shuttio.com/terms',
  emailSupport: 'help@shuttio.com',
  issueReportUrl: 'https://github.com/gmaramigin/shuttio-twenty-app/issues',
});
