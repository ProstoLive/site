// Мини-сервис счётчика поливов цветка на главной.
// Без зависимостей: node server/water/server.mjs
//
//   GET  /api/water -> { "count": N }         (сколько раз полили на этой неделе)
//   POST /api/water -> { "count": N + 1 }
//
// Слушает только localhost, наружу его отдаёт reverse proxy (Caddy).

import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const PORT = Number(process.env.WATER_PORT ?? 3001);
const DATA_FILE = process.env.WATER_DATA ?? './water-data.json';
const TIMEZONE = 'Europe/Moscow';
const MIN_INTERVAL_MS = 2000; // не чаще одного полива в 2 с с одного IP

// 'YYYY-MM-DD' понедельника текущей недели в нужном часовом поясе —
// по смене этой строки счётчик обнуляется (неделя идёт с понедельника)
function currentWeek() {
	const today = new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE })}T00:00:00Z`);
	const sinceMonday = (today.getUTCDay() + 6) % 7;
	today.setUTCDate(today.getUTCDate() - sinceMonday);
	return today.toISOString().slice(0, 10);
}

let state = { week: currentWeek(), count: 0 };

try {
	const saved = JSON.parse(await readFile(DATA_FILE, 'utf8'));
	if (typeof saved.week === 'string' && Number.isInteger(saved.count)) state = saved;
} catch {
	// первого запуска файла ещё нет — начинаем с нуля
}

function rollOver() {
	const week = currentWeek();
	if (state.week !== week) state = { week, count: 0 };
}

// запись атомарная (tmp + rename), очередь — чтобы параллельные POST не перетирали друг друга
let saving = Promise.resolve();
function save() {
	saving = saving
		.then(async () => {
			await mkdir(dirname(DATA_FILE), { recursive: true });
			const tmp = `${DATA_FILE}.tmp`;
			await writeFile(tmp, JSON.stringify(state));
			await rename(tmp, DATA_FILE);
		})
		.catch((err) => console.error('save failed:', err));
	return saving;
}

const lastWater = new Map(); // ip -> время последнего полива

function clientIp(req) {
	// сервис слушает только 127.0.0.1, значит заголовок ставит наш Caddy
	const forwarded = req.headers['x-forwarded-for'];
	return forwarded ? forwarded.split(',').at(-1).trim() : req.socket.remoteAddress;
}

setInterval(() => {
	const cutoff = Date.now() - MIN_INTERVAL_MS;
	for (const [ip, time] of lastWater) if (time < cutoff) lastWater.delete(ip);
}, 60_000).unref();

function send(res, status, body) {
	res.writeHead(status, {
		'Content-Type': 'application/json',
		'Cache-Control': 'no-store',
	});
	res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
	const { pathname } = new URL(req.url ?? '/', 'http://localhost');

	if (pathname !== '/api/water') return send(res, 404, { error: 'not found' });

	rollOver();

	if (req.method === 'GET') return send(res, 200, { count: state.count });

	if (req.method === 'POST') {
		const ip = clientIp(req);
		const now = Date.now();
		if (now - (lastWater.get(ip) ?? 0) < MIN_INTERVAL_MS) {
			return send(res, 429, { error: 'too fast', count: state.count });
		}
		lastWater.set(ip, now);

		state.count += 1;
		await save();
		return send(res, 200, { count: state.count });
	}

	res.setHeader('Allow', 'GET, POST');
	send(res, 405, { error: 'method not allowed' });
}).listen(PORT, '127.0.0.1', () => {
	console.log(`water service: http://127.0.0.1:${PORT}/api/water, data in ${DATA_FILE}`);
});
