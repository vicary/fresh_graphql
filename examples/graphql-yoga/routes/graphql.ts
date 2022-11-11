import type { HandlerContext } from "$fresh/server.ts";
import { fromManifest } from "$fresh_graphql/schema.ts";
import { createServer } from "@graphql-yoga/common";
import manifest from "../fresh_graphql.gen.ts";

const yoga = createServer<HandlerContext>({
  logging: true,
  maskedErrors: false,
  schema: fromManifest(manifest),
});

export const handler = async (req: Request, ctx: HandlerContext) => {
  return await yoga.handleRequest(req, ctx);
};
