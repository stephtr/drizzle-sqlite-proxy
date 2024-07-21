/* eslint-disable no-console */
import type { DrizzleConfig } from 'drizzle-orm';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';

export const drizzle = <
	TSchema extends Record<string, unknown> = Record<string, never>,
>({
	sqliteProxyUrl = 'http://localhost:3010',
	...config
}: (DrizzleConfig<TSchema> & { sqliteProxyUrl?: string }) | undefined = {}) =>
	drizzleProxy<TSchema>(
		async (sql, params, method) => {
			const response = await fetch(`${sqliteProxyUrl}/query`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache',
				},
				cache: 'no-store',
				body: JSON.stringify({ sql, params, method }),
			});

			if (!response.ok) {
				console.error(
					`Error from sqlite proxy server: ${response.status} ${response.statusText}`,
				);
				return { rows: [] };
			}
			try {
				const text = await response.text();
				if (!text) return { rows: undefined as any }; // for a get request, rows doesn't contain an array with one row, but instead the row itself; so we return undefined if there are was no row found
				const data = JSON.parse(text);
				return { rows: data as any[] };
			} catch (error) {
				console.error(error);
				return { rows: [] };
			}
		},
		async (queries) => {
			const response = await fetch(`${sqliteProxyUrl}/batch`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache',
				},
				cache: 'no-store',
				body: JSON.stringify({ queries }),
			});

			const emptyResult = [] as Array<{ rows: any[] }>;

			if (!response.ok) {
				console.error(
					`Error from sqlite proxy server: ${response.status} ${response.statusText}`,
				);
				return emptyResult;
			}
			try {
				const text = await response.text();
				if (!text) return emptyResult;
				const data = JSON.parse(text) as Array<any[]>;
				return data.map((r) => ({ rows: r }));
			} catch (error) {
				console.error(error);
				return emptyResult;
			}
		},
		config,
	);
