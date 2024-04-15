# drizzle-sqlite-proxy

This tool provides a proxy server for drizzle-orm to access a sqlite database.

## Quickstart

Run the sqlite server independently, for example by adding it to your package.json's scripts:

```
"scripts": {
	"dev": "next dev & drizzle-sqlite-proxy-server",
	...
```

You can then access it via your application:

```js
import { drizzle } from "drizzle-sqlite-proxy";
import * as schema from "./schema";

export const db = drizzle({ schema });
```

In case you want to use Cloudflare's D1 database in production but `SQLite` during development, you can also use:

```js
import { drizzle } from "drizzle-sqlite-proxy/with-d1";
import * as schema from "./schema";

export const db = drizzle(process.env.DB, { schema });
```

This resolves to `drizzle-orm/d1` during production and `drizzle-orm/sqlite-proxy` during development.

## Usage

The drizzle function exported from this package supports specifying a server url via:

```js
export const db = drizzle({ sqliteProxyUrl: "http://localhost:3010" });
```

The server supports the following arguments:

```
drizzle-sqlite-proxy-server [...]

-p, --port <number>
Port to listen on (default: "3010")

-n, --no-migrations
Disables automatic application of migrations

-d, --database-location <string>
Location of the sqlite database file (default: "db/db.sqlite")

-m, --migrations-folder <string>
Location of the drizzle migrations folder (default: "db/drizzle")
```

## Credits

This code is based on drizzle's [sqlite-proxy example](https://github.com/drizzle-team/drizzle-orm/tree/main/examples/sqlite-proxy).
