import { createYoga } from "./deps.ts";
import type { Manifest } from "./schema.ts";
import { fromManifest } from "./schema.ts";

export type CreateHandlerOptions = {
  debug?: boolean;
};

/**
 * A stubbed version of FreshContext.
 *
 * Fresh 1.x uses HTTP import which is not compatible with JSR modules, this
 * will be a direct export from Fresh when 2.x is out.
 *
 * ```ts
 * import type { FreshContext } from "jsr:@fresh/core@^2.0";
 * ```
 */
export interface FreshContext<
  State = Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  Data = any,
  NotFoundData = Data,
> {
  /** @types deprecated */
  localAddr?: Deno.NetAddr;
  remoteAddr: Deno.NetAddr;
  url: URL;
  basePath: string;
  route: string;
  /** @deprecated Use `.route` instead */
  pattern: string;
  destination: "internal" | "static" | "route" | "notFound";
  params: Record<string, string>;
  isPartial: boolean;
  state: State;
  config: {
    dev: boolean;
    build: {
      outDir: string;
      target: string | string[];
    };
    staticDir: string;
    server: Partial<Deno.ServeTlsOptions>;
    basePath: string;
  };
  data: Data;
  /** The error that caused the error page to be loaded. */
  error?: unknown;
  /** Sringified code frame of the error rendering failed (only in development mode) */
  codeFrame?: unknown;

  // These properties may be different
  renderNotFound: (data?: NotFoundData) => Response | Promise<Response>;
  render: (
    data?: Data,
  ) => Response | Promise<Response>;
  next: () => Promise<Response>;
}

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
