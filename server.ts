import { createYoga } from "./deps.ts";
import type { Manifest } from "./schema.ts";
import { fromManifest } from "./schema.ts";

export type CreateHandlerOptions = {
  debug?: boolean;
};

/**
 * A stubbed version of FreshContext.
 *
 * Fresh 1.x uses HTTP import which is not compatible with JSR modules, to be
 * updated when Fresh 2.x is released.
 *
 * ```ts
 * import type { FreshContext } from "jsr:@fresh/core@^2.0";
 * ```
 */
export type FreshContext = {
  request: Request;
};

export function createHandler<TManifest extends Manifest>(
  manifest: TManifest,
  options?: CreateHandlerOptions,
): (req: Request, ctx: FreshContext) => Promise<Response> {
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
