import type { HandlerContext } from "$fresh/server.ts";
import { fromManifest } from "$fresh_graphql/schema.ts";
import { createServer } from "@graphql-yoga/common";
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
