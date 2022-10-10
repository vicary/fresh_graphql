// dev.ts: A simple modification of $fresh/dev.ts for GraphQL.
import { ensureDir, walk } from "https://deno.land/std@0.155.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.155.0/path/mod.ts";
import {
  fromFileUrl,
  toFileUrl,
} from "https://deno.land/x/fresh@1.1.1/src/dev/deps.ts";
import { ensureMinDenoVersion } from "https://deno.land/x/fresh@1.1.1/src/dev/mod.ts";

export type DevOptions = {
  /** Path to generated schema manifest. */
  entrypoint?: string;
  /** Base directory of graphql modules. */
  modulePath?: string;
};

interface Manifest {
  modules: string[];
}

export async function collect(directory: string): Promise<Manifest> {
  const modulesDir = join(directory, "./graphql");
  const baseUrl = toFileUrl(modulesDir).href;

  // See https://github.com/denoland/deno_std/issues/1310
  for await (const _ of Deno.readDir(directory)) {
    // noop
  }

  const modules: string[] = [];
  try {
    for await (
      const entry of walk(modulesDir, {
        exts: [".ts", ".js"],
        followSymlinks: true,
        includeDirs: false,
        includeFiles: true,
      })
    ) {
      if (entry.isFile) {
        modules.push(
          toFileUrl(entry.path).href.substring(baseUrl.length),
        );
      }
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
  modules.sort();

  return { modules };
}

export async function generate(entrypoint: string, { modules }: Manifest) {
  const output = /* TypeScript */ `// DO NOT EDIT.
// This file is generated and updated by fresh_graphql during development.
// This file should be checked into source control.

${
    modules.map((file, i) => `import * as $${i} from "./graphql${file}";`)
      .join("\n")
  }

const manifest = {
  modules: {
    ${modules.map((file, i) => `"${file.slice(1)}": $${i}`).join(",\n    ")}
  },
  baseUrl: import.meta.url,
};

export default manifest;
`;

  const procFmt = Deno.run({
    cmd: [Deno.execPath(), "fmt", "-"],
    stdin: "piped",
    stdout: "piped",
    stderr: "null",
  });

  await ensureDir(dirname(entrypoint));

  const file = await Deno.create(entrypoint);

  await new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(output));
      controller.close();
    },
  }).pipeTo(procFmt.stdin.writable);

  await procFmt.stdout.readable.pipeTo(file.writable);
  await procFmt.status();

  procFmt.close();

  console.log(
    `%cGraphQL schema has been generated for ${modules.length} resolvers.`,
    "color: blue; font-weight: bold",
  );
}

export async function dev(base: string, {
  entrypoint = `./fresh_graphql.gen.ts`,
}: DevOptions = {}) {
  ensureMinDenoVersion();

  entrypoint = new URL(entrypoint, base).href;

  const dir = dirname(fromFileUrl(base));

  let currentManifest: Manifest;
  const prevManifest = Deno.env.get("FRSH_FQL_DEV_PREVIOUS_MANIFEST");
  if (prevManifest) {
    currentManifest = JSON.parse(prevManifest);
  } else {
    currentManifest = { modules: [] };
  }
  const newManifest = await collect(dir);
  Deno.env.set("FRSH_FQL_DEV_PREVIOUS_MANIFEST", JSON.stringify(newManifest));

  const manifestChanged = !arraysEqual(
    currentManifest.modules,
    newManifest.modules,
  );

  if (manifestChanged) {
    await generate(fromFileUrl(entrypoint), newManifest);
  }

  await import(entrypoint);
}

function arraysEqual<T>(a: T[], b: T[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
