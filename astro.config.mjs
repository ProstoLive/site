import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
	site: 'https://artredkiy.com',
	integrations: [mdx()],
	vite: {
		server: {
			// в проде /api проксирует Caddy, локально — сам dev-сервер (node server/water/server.mjs)
			proxy: { '/api': 'http://127.0.0.1:3001' },
		},
	},
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
			smartypants: { dashes: 'oldschool' },
			remarkRehype: {
				footnoteLabel: 'Источники',
				footnoteBackLabel: 'Вернуться к тексту',
			},
		}),
	},
});
