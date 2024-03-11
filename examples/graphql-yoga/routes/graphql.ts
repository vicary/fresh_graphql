import { type FreshContext } from "$fresh/server.ts";
import { fromManifest } from "@vicary/fresh-graphql";
import { createYoga } from "graphql-yoga";
import manifest from "../graphql.gen.ts";

// FRSH_GQL_DEV is set when you start the GraphQL development server in dev.ts.
const debug = Deno.env.has("FRSH_GQL_DEV");

const yoga = createYoga<FreshContext>({
  graphiql: debug,
  logging: debug,
  maskedErrors: !debug,
  schema: fromManifest(manifest),
});

export const handler = async (req: Request, ctx: FreshContext) => {
  return await yoga.handleRequest(req, ctx);
};
