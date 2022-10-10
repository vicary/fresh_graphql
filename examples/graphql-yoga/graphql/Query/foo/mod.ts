export const schema = /* GraphQL */ `
  extend type Query {
    foo: String!
  }
`;

export const resolver = () => "Hello World!";
