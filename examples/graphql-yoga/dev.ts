#!/usr/bin/env -S deno run -A --watch=static/,routes/,graphql/

import dev from "$fresh/dev.ts";
import { dev as gqlDev } from "$fresh_graphql/mod.ts";

await gqlDev(import.meta.url);
await dev(import.meta.url, "./main.ts");
