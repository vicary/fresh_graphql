import type { IFieldResolver } from "@graphql-tools/utils";

export const schema = /* GraphQL */ `
  extend type Subscription {
    countdown(from: Int = 3): Int!
  }
`;

export const resolver: IFieldResolver<unknown, unknown, { from: number }> =
  async function* (_, { from }) {
    try {
      while (from > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yield { countdown: from };
        from--;
      }
    } finally {
      console.info(`Countdown finished${from > 0 ? ` at ${from}` : ""}.`);
    }
  };
