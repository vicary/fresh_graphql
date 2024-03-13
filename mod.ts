export { dev, type DevOptions } from "./dev.ts";
export {
  fromManifest,
  type GraphQLDirectiveModule,
  type GraphQLTypeModule,
  type Manifest,
} from "./schema.ts";

// Start interactive shell that automatically patches the fresh project.
if (import.meta.main) {
  await import("./cli.ts");
}
