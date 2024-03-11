// dev.ts: A simple modification of $fresh/dev.ts for GraphQL.

import {
  dirname,
  ensureDir,
  fromFileUrl,
  join,
  parsePath,
  toFileUrl,
  walk,
} from "./deps.ts";

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
        modules.push(toFileUrl(entry.path).href.substring(baseUrl.length));
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
  const output = `// DO NOT EDIT.
// This file is generated and updated by fresh-graphql during development.
// This file should be checked into source control.

${
    modules
      .map((file, i) => `import * as $${i} from "./graphql${file}";`)
      .join("\n")
  }

const manifest = {
  modules: {
    ${
    modules
      .map((file, i) => {
        const { dir, name } = parsePath(file);
        // Remove leading slash
        const key: string = [dir.slice(1), name]
          .map((v) => v.trim())
          .filter(Boolean)
          .join(".");

        return `"${key}": $${i}`;
      })
      .join(",\n    ")
  }
  },
  baseUrl: import.meta.url,
};

export default manifest;
`;

  const procFmt = new Deno.Command(
    Deno.execPath(),
    {
      args: ["fmt", "-"],
      stdin: "piped",
      stdout: "piped",
      stderr: "null",
    },
  ).spawn();

  await ensureDir(dirname(entrypoint));

  await Promise.all([
    (async (): Promise<void> => {
      const writer = procFmt.stdin.getWriter();
      await writer.ready;

      writer.write(new TextEncoder().encode(output));
      await writer.close();
    })(),
    (async (): Promise<void> => {
      const file = await Deno.create(entrypoint);
      await procFmt.stdout.pipeTo(file.writable);
    })(),
  ]);

  await procFmt.status;

  console.log(
    `%cGraphQL schema has been generated for ${modules.length} resolvers.`,
    "color: blue; font-weight: bold",
  );
}

/**
 * Run the development server for GraphQL and generates a GraphQL schema
 * manifest compatible with `.fromManifest()`.
 */
export async function dev(
  base: string,
  { entrypoint = `./graphql.gen.ts` }: DevOptions = {},
) {
  // ensureMinDenoVersion();

  Deno.env.set("FRSH_GQL_DEV", "1");

  entrypoint = new URL(entrypoint, base).href;

  const dir = dirname(fromFileUrl(base));

  let currentManifest: Manifest;
  const prevManifest = Deno.env.get("FRSH_FQL_DEV_MANIFEST");
  if (prevManifest) {
    currentManifest = JSON.parse(prevManifest);
  } else {
    currentManifest = { modules: [] };
  }
  const newManifest = await collect(dir);
  Deno.env.set("FRSH_FQL_DEV_MANIFEST", JSON.stringify(newManifest));

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
