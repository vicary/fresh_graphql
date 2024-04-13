# fresh-graphql

A simple GraphQL server for Deno Fresh.

## Live Demo

1. [`graphql-yoga`](https://fresh-graphql-yoga.deno.dev)
1. `apollo-server` (soon™)

## Why `fresh-graphql`?

1. You want file based routing.
1. You want GraphQL.
1. You have a [Deno Fresh](https://fresh.deno.dev) project.
1. `deno deploy` does not support dynamic imports.

## Installation

```bash
# Create a Fresh project
> deno run -A -r https://fresh.deno.dev

# Add fresh-graphql to your project
> deno run -A jsr:@vicary/fresh-graphql
```

### Manual Installation

You may also patch the files manually if you have modified `dev.ts` or
`deno.json` for an existing Fresh project.

#### dev.ts

```diff
-#!/usr/bin/env -S deno run -A --watch=static/,routes/
+#!/usr/bin/env -S deno run -A --watch=static/,routes/,graphql/

import "https://deno.land/x/dotenv/load.ts";

import dev from "$fresh/dev.ts";
+import { dev as graphql } from "@vicary/fresh-graphql";

+await graphql(import.meta.url);
await dev(import.meta.url, "./main.ts");
```

#### deno.json

```diff
"tasks": {
-  "start": "deno run -A --watch=static/,routes/ dev.ts",
+  "start": "deno run -A --watch=static/,routes/,graphql/ dev.ts",
}
```

## Usage

1. Run `deno task start`
1. Visit `http://localhost:8000/graphql` for an GraphiQL interface.

### Entrypoint

Our CLI will generate a default GraphQL endpoint for you, you may also do it
manually by copying the contents below:

```ts
// routes/graphql.ts

import { createHandler } from "@vicary/fresh-graphql";
import manifest from "../graphql.gen.ts";

export const handler = createHandler(manifest);
```

### Queries and Mutations

This is a GraphQL version of the joke API when you create a new Fresh project.

```ts
// graphql/Query/joke.ts

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
// graphql/Subscription/countdown.ts

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

### Directives

Supported, documentations coming.

If you need it now, you may read our source code.

### Side notes

1. `graphql-yoga` is chosen for it's simplicity, you may use any GraphQL servers
   compatible with `@graphql-tools/schema`.
1. `graphql.gen.ts` This is the manifest file generated whenever you make
   changes to source codes in the `graphql` directory.

## Sponsorship

If you think I did a good job or want to see a feature happening,
[a coffee would do](https://buymeacoffee.com/vicary).
