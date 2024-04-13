import { createYoga, type FreshContext } from "./deps.ts";
import type { Manifest } from "./schema.ts";
import { fromManifest } from "./schema.ts";

export type CreateHandlerOptions = {
  debug?: boolean;
};

export function createHandler<TManifest extends Manifest>(
  manifest: TManifest,
  options?: CreateHandlerOptions,
) {
  // FRSH_GQL_DEV is set when you start the GraphQL development server in dev.ts.
  const debug = options?.debug ?? Deno.env.has("FRSH_GQL_DEV");

  const yoga = createYoga<FreshContext>({
    graphiql: debug,
    logging: debug,
    maskedErrors: !debug,
    schema: fromManifest(manifest),
  });

  return async (req: Request, ctx: FreshContext) => {
    return await yoga.handleRequest(req, ctx);
  };
}
