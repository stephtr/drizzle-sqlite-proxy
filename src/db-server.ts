/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import express from 'express';
import { program } from 'commander';
import { join } from 'path';

program
	.name('drizzle-sqlite-proxy-server')
	.description(
		'Provides a proxy server for drizzle-orm to access a sqlite database',
	)
	.option('-p, --port <number>', 'Port to listen on', '3010')
	.option(
		'-n, --no-migrations',
		'Disables automatic application of migrations',
	)
	.option(
		'-d, --database-location <string>',
		'Location of the sqlite database file',
		'db/db.sqlite',
	)
	.option(
		'-m, --migrations-folder <string>',
		'Location of the drizzle migrations folder',
		'db/drizzle',
	);
program.parse();
const options = program.opts<{
	port: string;
	noMigrations: boolean;
	databaseLocation: string;
	migrationsFolder: string;
}>();
const port = parseInt(options.port, 10);
let { noMigrations, databaseLocation, migrationsFolder } = options;
migrationsFolder = join(process.cwd(), migrationsFolder);
databaseLocation = join(process.cwd(), databaseLocation);

const db = new Database(databaseLocation);
if (!noMigrations) {
	migrate(drizzle(db), { migrationsFolder });
}

const app = express();
app.use(express.json({ limit: '10mb' }));

function handleQuery({
	sql,
	params,
	method,
}: {
	sql: string;
	params: string;
	method: string;
}) {
	console.log(`[DB ${method}]:`, sql);

	switch (method) {
		case 'run':
			return db.prepare(sql).run(params);
		case 'all':
		case 'values':
			return db.prepare(sql).raw().all(params);
		case 'get':
			return db.prepare(sql).raw().get(params);
		default:
			throw new Error(`Unkown method ${method}`);
	}
}

app.post('/query', (req, res) => {
	const query = req.body as { sql: string; params: string; method: string };
	try {
		const result = handleQuery(query);
		res.send(result);
	} catch (e) {
		console.error((e as Error).message);
		res.status(500).json({ error: (e as Error).message });
	}
});

app.post('/batch', (req, res) => {
	const { queries } = req.body as {
		queries: Array<{ sql: string; params: string; method: string }>;
	};

	try {
		const results = queries.map((query) => handleQuery(query));
		res.send(results);
	} catch (e) {
		console.error((e as Error).message);
		res.status(500).json({ error: (e as Error).message });
	}
});

app.post('/migrate', (req, res) => {
	const { queries } = req.body as { queries: string[] };

	db.exec('BEGIN');
	try {
		// eslint-disable-next-line no-restricted-syntax
		for (const query of queries) {
			db.exec(query);
		}

		db.exec('COMMIT');
	} catch (e) {
		db.exec('ROLLBACK');
	}

	res.send({});
});

app.listen(port, () => {
	console.log(`DB server listening on port ${port}`);
});
