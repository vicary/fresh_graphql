# fresh_graphql

GraphQL development for Deno Fresh.

## Live Demo

1. [`graphql-yoga`](https://fresh-graphql-yoga.deno.dev/graphql)
1. `apollo-server` (soon™)

## Why `fresh_graphql`?

1. Familiar developer experience with `fresh` projects.
1. `deno deploy` has no dynamic imports.
1. [`tRPC`](https://trpc.io) doesn't support deno (yet).

## Installation

`fresh_graphql` hooks into the `dev.ts` lifecycle of fresh,
[create a fresh project](https://fresh.deno.dev/docs/getting-started/create-a-project)
if you haven't done so.

You need to patch 3 files from an existing fresh project:

### 1. `import_map.json`

Versions are removed for clarity, should be compatible with `fresh@^1.1.1`.

```diff
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh/",
+   "$fresh_graphql/": "https://deno.land/x/fresh_graphql/",

    "preact": "https://esm.sh/preact",
    "preact/": "https://esm.sh/preact/",

    "preact-render-to-string": "https://esm.sh/*preact-render-to-string",

    "twind": "https://esm.sh/twind",
    "twind/": "https://esm.sh/twind/"
  }
}
```

### 2. `deno.json`

```diff
{
  "tasks": {
-    "start": "deno run -A --watch=static/,routes/ dev.ts"
+    "start": "deno run -A --watch=static/,routes/,graphql/ dev.ts"
  }
}
```

### 3. `dev.ts`

```diff
- #!/usr/bin/env -S deno run -A --watch=static/,routes/
+ #!/usr/bin/env -S deno run -A --watch=static/,routes/,graphql/

import "https://deno.land/x/dotenv/load.ts";

import dev from "$fresh/dev.ts";
+ import { dev as graphqlDev } from "$fresh_graphql/mod.ts";

+ await graphqlDev(import.meta.url);
await dev(import.meta.url, "./main.ts");
```

## Usage

### Entrypoint

Any data handler routes would work, the example below uses `/graphql` as a
convension.

```ts
// routes/graphql.ts

import type { HandlerContext } from "$fresh/server.ts";
import { createServer } from "@graphql-yoga/common";
import { fromManifest } from "$fresh_graphql/schema.ts";
import manifest from "../fresh_graphql.gen.ts";

const yoga = createServer<HandlerContext>({
  logging: true,
  maskedErrors: false,
  schema: fromManifest(manifest),
});

export const handler = async (req: Request, ctx: HandlerContext) => {
  return await yoga.handleRequest(req, ctx);
};
```

1. `@graphql-yoga/common` is chosen for it's simplicity, you may use any GraphQL
   serveres compatible with `@graphql-tools/schema`.
1. `fresh_graphql.gen.ts` This is the manifest file generated whenever you make
   changes to source codes in the `./graphql` directory.

### Queries and Mutations

```ts
// ./graphql/Query/joke.ts

export const schema = /* GraphQL */ `
  extend type Query {
    joke: String!
  }
`;

// Jokes courtesy of https://punsandoneliners.com/randomness/programmer-jokes/
const JOKES = [
  "Why do Java developers often wear glasses? They can't C#.",
  "A SQL query walks into a bar, goes up to two tables and says “can I join you?”",
  "Wasn't hard to crack Forrest Gump's password. 1forrest1.",
  "I love pressing the F5 key. It's refreshing.",
  "Called IT support and a chap from Australia came to fix my network connection.  I asked “Do you come from a LAN down under?”",
  "There are 10 types of people in the world. Those who understand binary and those who don't.",
  "Why are assembly programmers often wet? They work below C level.",
  "My favourite computer based band is the Black IPs.",
  "What programme do you use to predict the music tastes of former US presidential candidates? An Al Gore Rhythm.",
  "An SEO expert walked into a bar, pub, inn, tavern, hostelry, public house.",
];

export const resolver = () => JOKES[Math.floor(Math.random() * JOKES.length)];
```

Schema level types, `Query`, `Mutation` and `Subscription`, will be
automatically created when such a corresponding extension statement is found.

Resolver object will be wrapped according to the directory structure, i.e.
`{ Query: { joke: resolver } }`. To override this behavior, export an object
instead.

```ts
export const resolver = {
  Query: {
    foo: () => "bar";
  }
};
```

### Subscriptions

```ts
// ./graphql/Subscription/countdown.ts

export const schema = /* GraphQL */ `
  extend type Subscription {
    countdown(from: Int = 0): Int!
  }
`;

export const resolver = async function* (_, { from }) {
  while (from-- > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield { countdown: from };
  }
};
```

## Sponsorship

If you think I did a good job or want to see a feature happening,
[a coffee would do](https://buymeacoffee.com/vicary).
