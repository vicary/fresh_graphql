# fresh_graphql

GraphQL development for Deno Fresh.

## Live Demo

1. [`graphql-yoga`](https://fresh-graphql-yoga.deno.dev/graphql)
1. `apollo-server` (soon<sup>TM</sup>)

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

const schema = fromManifest(manifest);

const yoga = createServer<HandlerContext>({
  logging: true,
  maskedErrors: false,
  schema,
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

The example below follows the naming convension and use `mod.ts`, but you may
name your TypeScript and/or JavaScript files anyway you like.

```ts
// ./graphql/Query/test/mod.ts

export const schema = `
  extend type Query {
    foo: String!
  }
`;

export const resolver = () => "Hello World!";
```

Schema level types, `Query`, `Mutation` and `Subscription`, will be
automatically created when such a corresponding extension statement is found.

Resolver object will be wrapped according to the directory structure, i.e.
`{ Query: { foo: resolver } }`. To override this behavior, export an object
instead.

```ts
export const resolver = {
  Query: {
    bar: () => "Hello world!";
  }
};
```

### Subscriptions

```ts
// graphql/Subscription/countdown/mod.ts

export const schema = `
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
