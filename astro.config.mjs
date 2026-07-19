// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	// TODO: заменить на реальный домен перед деплоем — нужен для абсолютных
	// ссылок в RSS
	site: 'https://example.com',
	integrations: [mdx()],
});
