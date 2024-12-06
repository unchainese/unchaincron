/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import {D1Database,KVNamespace} from "@cloudflare/workers-types";

interface Env {
	DB: D1Database;
	KV: KVNamespace;
}


export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		const nowTs = Math.floor(Date.now() / 1000);
		await env.DB.prepare('DELETE FROM nodes WHERE active_ts < ?').bind(nowTs - 3600 * 3).run();

		const nowDate = new Date().toISOString().slice(0, 10);
		//fetch all raw rows
		const q1 = 'SELECT uid, created_date, SUM(kb) AS total_kb FROM usages WHERE created_date = ? AND category = ? GROUP BY uid, created_date';
		const { results } = await env.DB.prepare(q1).bind(nowDate, 'raw').all<{
			uid: string,
			total_kb: number,
			created_date: string
		}>();
		//delete all daily rows
		await env.DB.prepare('DELETE FROM usages WHERE created_date = ? AND category = ?').bind(nowDate, 'raw').run();
		//batch insert
		const batchQ = [];
		for (const one of results) {
			if (one.total_kb === 0) continue;
			const q2 = 'INSERT INTO usages (uid, kb, created_date, category) VALUES (?, ?, ?, ?)';
			batchQ.push(env.DB.prepare(q2).bind(one.uid, one.total_kb, nowDate, 'daily'));
		}
		await env.DB.batch(batchQ);
	},
	async fetch(request, env, ctx): Promise<Response> {
		return new Response('Hello World!');
	}
} satisfies ExportedHandler<Env>;
