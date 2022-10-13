import type { IFieldResolver } from "@graphql-tools/utils";

export const schema = /* GraphQL */ `
  extend type Subscription {
    countdown(from: Int = 3): Int!
  }
`;

export const resolver: IFieldResolver<unknown, unknown, { from: number }> =
  async function* (_, { from }) {
    for (let i = from; i >= 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      yield { countdown: i };
    }
  };
