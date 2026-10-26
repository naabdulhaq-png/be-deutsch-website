import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  vite: { cacheDir: '.astro/w03-1-vite-cache', build: { assetsInlineLimit: 0 } },
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
