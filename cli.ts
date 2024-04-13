#! /env/bin/node

import { assert, colors, log } from "./deps.ts";
import diff from "./diff.json" with { type: "json" };

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: ((): log.FormatterFunction => {
        const levelFormatters: Record<
          string,
          (record: log.LogRecord) => string
        > = {
          CRITICAL: (record) => colors.red(colors.bold(`! ${record.msg}`)),
          ERROR: (record) => `${colors.red(colors.bold("✖"))} ${record.msg}`,
          WARN: (record) => `${colors.yellow(colors.bold("!"))} ${record.msg}`,
          INFO: (record) => `${colors.blue(colors.bold("ℹ"))} ${record.msg}`,
          DEBUG: (record) => `• ${record.msg}`,
        };

        const defaultFormatter = (record: log.LogRecord) =>
          `${levelFormatters[record.levelName]} ${record.msg}`;

        return (record) =>
          (levelFormatters[record.levelName] ?? defaultFormatter)(record);
      })(),
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

async function main() {
  if (!await installPackage()) {
    log.error("Unable to install fresh-graphql package.");
    return;
  }

  if (!await ensurePatchExecutable()) {
    log.warn("`patch` not found in your environment.");
    return;
  }

  if (promptYesNo("Do you want fresh-graphql to patch your `dev.ts`?", true)) {
    if (!await patchDev()) {
      log.error("Unable to patch dev.ts, please try to do it manually.");
      log.info(
        `Our patch works with an unmodified dev.ts generated after Fresh 1.6.5.`,
      );
    }
  }

  if (
    promptYesNo("Do you want fresh-graphql to patch your `deno.json`?", true)
  ) {
    if (!await patchDenoJson()) {
      log.error("Unable to patch deno.json, please try to do it manually.");
    }
  }
}

await main();

async function installPackage() {
  const { success } = await new Deno.Command(
    "deno",
    { args: ["add", "jsr:@vicary/fresh-graphql"] },
  ).spawn().status;

  return success;
}

async function ensurePatchExecutable() {
  try {
    const { success } = await new Deno.Command(
      "patch",
      {
        args: ["--version"],
        stdout: "null",
        stderr: "null",
      },
    ).spawn().status;

    assert(success);

    return true;
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;

    return false;
  }
}

function promptYesNo(question: string, defaultYes = false) {
  const defaultAnswer = defaultYes ? "Y/n" : "y/N";
  const answer = prompt(`${question} [${defaultAnswer}]`);

  if (!answer) {
    return defaultYes;
  }

  return answer.trim().toLowerCase() === "y";
}

async function patchDev() {
  // Ensure file exists
  await Deno.stat("dev.ts");

  return await attemptPatch();

  async function attemptPatch(): Promise<boolean> {
    const en = new TextEncoder();
    const de = new TextDecoder();

    const runPatch = async (...args: string[]) => {
      const proc = new Deno.Command("patch", {
        args,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      }).spawn();

      const stdin = proc.stdin.getWriter();
      stdin.write(en.encode(diff.dev));
      stdin.close();

      return await proc.output();
    };

    // Dry-run
    {
      const out = await runPatch("-NCs", "./dev.ts");
      if (!out.success) {
        const stdout = de.decode(out.stdout);

        if (stdout.includes("previously applied")) {
          log.info("Your dev.ts is already patched, skipping.");

          return true;
        }

        return false;
      }
    }

    // Actual run
    const out = await runPatch("-Ns", "./dev.ts");
    if (!out.success) {
      return false;
    }

    log.info(`dev.ts patched successfully.`);

    return true;
  }
}

async function patchDenoJson(): Promise<boolean> {
  // Ensure file exists
  await Deno.stat("deno.json");

  // Apply the patch
  try {
    // Read the JSON
    const json = JSON.parse(
      new TextDecoder().decode(await Deno.readFile("deno.json")),
    );

    const task = json.tasks.start;

    if (!task.includes("--watch=static/,routes/ dev.ts")) {
      if (
        task.includes("--watch=static/,routes/,graphql/ dev.ts")
      ) {
        log.info(`Your deno.json is already patched, skipping.`);

        return true;
      }

      return false;
    }

    json.tasks.start = task.replace(
      "--watch=static/,routes/ dev.ts",
      "--watch=static/,routes/,graphql/ dev.ts",
    );

    // Write the JSON back
    await Deno.writeFile(
      "deno.json",
      new TextEncoder().encode(JSON.stringify(json, null, 2) + "\n"),
    );
  } catch {
    return false;
  }

  log.info(`deno.json patched successfully.`);

  return true;
}
