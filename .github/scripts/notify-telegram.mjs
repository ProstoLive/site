import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';

const ZERO_SHA = '0000000000000000000000000000000000000000';
const SITE_URL = 'https://artredkiy.com';
const BLOG_PATTERN = 'src/content/blog/*/index.md';

const before = process.env.GITHUB_EVENT_BEFORE;
const after = process.env.GITHUB_EVENT_AFTER;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

function git(args) {
	return execFileSync('git', args, { encoding: 'utf8' });
}

function getChangedBlogFiles(beforeRef, afterRef) {
	const output = git([
		'diff',
		'--name-only',
		'--diff-filter=ACM',
		beforeRef,
		afterRef,
		'--',
		BLOG_PATTERN,
	]);
	return output.split('\n').filter(Boolean);
}

function readFrontmatterAtRef(ref, path) {
	let content;
	try {
		content = git(['show', `${ref}:${path}`]);
	} catch {
		return null;
	}
	const { data } = matter(content);
	return {
		title: data.title,
		description: data.description,
		tags: data.tags ?? [],
		draft: data.draft ?? false,
	};
}

function extractSlug(path) {
	return path.split('/').at(-2);
}

function escapeHtml(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function sanitizeHashtag(tag) {
	return tag.replace(/\s+/g, '').replace(/[^\p{L}\p{N}_]/gu, '');
}

function buildMessage(post) {
	const url = `${SITE_URL}/blog/${post.slug}/`;
	const parts = [
		`<b><u>${escapeHtml(post.title)}</u></b>`,
		'',
		escapeHtml(post.description),
		'',
		url,
	];
	const hashtags = post.tags.map((tag) => `#${sanitizeHashtag(tag)}`).filter((t) => t !== '#');
	if (hashtags.length > 0) {
		parts.push('', hashtags.join('\n'));
	}
	return parts.join('\n');
}

async function sendTelegramMessage(text) {
	const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
	const res = await fetch(endpoint, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			disable_web_page_preview: false,
		}),
	});
	if (!res.ok) {
		throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
	}
}

async function main() {
	if (!before || !after) {
		throw new Error('GITHUB_EVENT_BEFORE / GITHUB_EVENT_AFTER are not set.');
	}

	if (before === ZERO_SHA) {
		console.log('First push to branch (before SHA is all-zeros) — skipping notification.');
		return;
	}

	const changedFiles = getChangedBlogFiles(before, after);
	if (changedFiles.length === 0) {
		console.log('No blog post files changed in this push.');
		return;
	}

	const newlyPublished = [];
	for (const file of changedFiles) {
		const oldData = readFrontmatterAtRef(before, file);
		const newData = readFrontmatterAtRef(after, file);

		const wasPublishable = oldData !== null && oldData.draft === false;
		const isPublishable = newData !== null && newData.draft === false;

		if (!wasPublishable && isPublishable) {
			newlyPublished.push({ slug: extractSlug(file), ...newData });
		}
	}

	if (newlyPublished.length === 0) {
		console.log('No newly published posts in this push.');
		return;
	}

	let hadFailure = false;
	for (const post of newlyPublished) {
		const message = buildMessage(post);
		try {
			await sendTelegramMessage(message);
			console.log(`Posted to Telegram: ${post.slug}`);
		} catch (err) {
			hadFailure = true;
			console.error(`Failed to post ${post.slug} to Telegram:`, err.message);
		}
	}

	if (hadFailure) {
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
