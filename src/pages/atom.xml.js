import { getCollection } from 'astro:content';

function escapeXml(str) {
	return str.replace(
		/[&<>"']/g,
		(c) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&apos;',
			})[c],
	);
}

export async function GET(context) {
	const posts = (
		await getCollection('blog', ({ data }) => (import.meta.env.PROD ? !data.draft : true))
	).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	const site = context.site.toString().replace(/\/$/, '');
	const feedUpdated = (posts[0]?.data.updatedDate ?? posts[0]?.data.pubDate ?? new Date()).toISOString();

	const entries = posts
		.map((post) => {
			const link = `${site}/blog/${post.id}/`;
			const updated = (post.data.updatedDate ?? post.data.pubDate).toISOString();
			const categories = post.data.tags
				.map((tag) => `\n\t\t<category term="${escapeXml(tag)}" />`)
				.join('');
			return `
	<entry>
		<title>${escapeXml(post.data.title)}</title>
		<link href="${link}" />
		<id>${link}</id>
		<published>${post.data.pubDate.toISOString()}</published>
		<updated>${updated}</updated>
		<summary>${escapeXml(post.data.description)}</summary>${categories}
	</entry>`;
		})
		.join('');

	const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>.redkiy</title>
	<subtitle>Всё о моей жизни... ну, почти.</subtitle>
	<link href="${site}/atom.xml" rel="self" />
	<link href="${site}/" />
	<id>${site}/</id>
	<updated>${feedUpdated}</updated>${entries}
</feed>
`;

	return new Response(feed, {
		headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
	});
}
