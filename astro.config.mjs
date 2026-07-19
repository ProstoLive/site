// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
	// TODO: заменить на реальный домен перед деплоем — нужен для абсолютных
	// ссылок в RSS
	site: 'https://example.com',
	integrations: [mdx()],
	markdown: {
		// remark/rehype вместо дефолтного Sätteri — нужен для remark-math/rehype-katex
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
	},
});
