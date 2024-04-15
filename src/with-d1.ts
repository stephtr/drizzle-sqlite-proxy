import { DrizzleConfig } from 'drizzle-orm';
import { drizzle as drizzleSQLiteProxy } from './index.js';
import { DrizzleD1Database, drizzle as drizzleD1 } from 'drizzle-orm/d1';

let localDrizzle: <
    TSchema extends Record<string, unknown> = Record<string, never>,
>(
    d1DB: any,
    config: (DrizzleConfig<TSchema> & { sqliteProxyUrl?: string })
        | undefined,
) => DrizzleD1Database<TSchema>;

if (process.env.NODE_ENV === 'development') {
    localDrizzle = (d1DB, config) => drizzleSQLiteProxy(config);
} else {
    localDrizzle = (d1DB, config) => drizzleD1(d1DB, config);
}

export const drizzle = localDrizzle;
