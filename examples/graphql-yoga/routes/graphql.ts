import type { FreshContext } from "$fresh/server.ts";
import { fromManifest } from "@vicary/fresh-graphql";
import { createYoga } from "graphql-yoga";
import manifest from "../graphql.gen.ts";

const yoga = createYoga<FreshContext>({
  graphiql: true,
  logging: true,
  maskedErrors: false,
  schema: fromManifest(manifest),
});

export const handler = async (req: Request, ctx: FreshContext) => {
  return await yoga.handleRequest(req, ctx);
};
