import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://www.bedeutsch.de',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith('/404') && !path.startsWith('/fa/') && !path.startsWith('/preview-');
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
