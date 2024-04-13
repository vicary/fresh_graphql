import { createHandler } from "@vicary/fresh-graphql";
import manifest from "../graphql.gen.ts";

export const handler = createHandler(manifest);
