#!/usr/bin/env -S deno run -A --watch=static/,routes/,graphql/

import dev from "$fresh/dev.ts";
import { dev as graphql } from "@vicary/fresh-graphql";
import config from "./fresh.config.ts";

await graphql(import.meta.url);
await dev(import.meta.url, "./main.ts", config);
