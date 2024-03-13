// schema.ts: Process schema into an executable form from generated manifests.
// deno-lint-ignore-file no-explicit-any

import {
  type ArgumentMapper,
  type EnumTypeMapper,
  type EnumValueMapper,
  type FieldMapper,
  type GenericFieldMapper,
  type GraphQLFieldConfig,
  type GraphQLFieldResolver,
  type GraphQLInputFieldConfig,
  type GraphQLScalarType,
  type GraphQLSchema,
  type IExecutableSchemaDefinition,
  type InputFieldMapper,
  type InputObjectTypeMapper,
  type InterfaceTypeMapper,
  type IResolvers,
  makeExecutableSchema,
  MapperKind,
  mapSchema,
  type ObjectTypeMapper,
  type ScalarTypeMapper,
  type SchemaMapper as GraphQLSchemaMapper,
  type UnionTypeMapper,
} from "./deps.ts";

export type Callable = (...args: any[]) => any;

/** An object type definition with an optional resolver. */
export type GraphQLTypeModule = {
  /** GraphQL SDL */
  schema: string;

  /** Resolver of the schema, optional. */
  resolver?:
    | GraphQLScalarType
    | IResolvers
    | GraphQLFieldResolver<any, any, any, any>;
};

/** A directive definition with a schema mapper */
export type GraphQLDirectiveModule<TSchema extends string = string> = {
  schema: TSchema;

  /** Directive schema mapper */
  mapper: GraphQLSchemaMapper;
};

export type SchemaMapper<TSchema extends string> = TSchema extends
  `${infer _}directive @${infer _}(${infer _}) on ${infer TLocations}` ? (
    & (TLocations extends `${infer _}SCALAR${infer _}`
      ? { [MapperKind.SCALAR_TYPE]: ScalarTypeMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}OBJECT${infer _}`
      ? { [MapperKind.OBJECT_TYPE]: ObjectTypeMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}INTERFACE${infer _}`
      ? { [MapperKind.INTERFACE_TYPE]: InterfaceTypeMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}UNION${infer _}`
      ? { [MapperKind.UNION_TYPE]: UnionTypeMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}ENUM_VALUE${infer _}`
      ? { [MapperKind.ENUM_VALUE]: EnumValueMapper }
      : (TLocations extends `${infer _}ENUM${infer _}`
        ? { [MapperKind.ENUM_TYPE]: EnumTypeMapper }
        : Record<never, never>))
    & (TLocations extends `${infer _}INPUT_OBJECT${infer _}`
      ? { [MapperKind.INPUT_OBJECT_TYPE]: InputObjectTypeMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}INPUT_FIELD_DEFINITION${infer _}`
      ? { [MapperKind.INPUT_OBJECT_FIELD]: InputFieldMapper }
      : Record<never, never>)
    & (TLocations extends `${infer _}FIELD_DEFINITION${infer _}` ? {
        [MapperKind.COMPOSITE_FIELD]?: FieldMapper;
        [MapperKind.FIELD]?: GenericFieldMapper<
          GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig
        >;
        [MapperKind.INTERFACE_FIELD]?: FieldMapper;
        [MapperKind.OBJECT_FIELD]?: FieldMapper;
        [MapperKind.ROOT_FIELD]?: FieldMapper;
        [MapperKind.QUERY_ROOT_FIELD]?: FieldMapper;
        [MapperKind.MUTATION_ROOT_FIELD]?: FieldMapper;
        [MapperKind.SUBSCRIPTION_ROOT_FIELD]?: FieldMapper;
      }
      : Record<never, never>)
    & (TLocations extends `${infer _}ARGUMENT_DEFINITION${infer _}`
      ? { [MapperKind.ARGUMENT]: ArgumentMapper }
      : Record<never, never>)
  )
  : never;

/**
 * The generated GraphQL manifest file content.
 */
export type Manifest = {
  // modules: Record<string, GraphQLModule>;
  modules: {
    [key: string]:
      | GraphQLDirectiveModule
      | GraphQLTypeModule;
  };
  baseUrl: string;
};

/**
 * Converting a generated manifest into a GraphQL schema object.
 */
export function fromManifest<
  TManifest extends Manifest,
  TContext = unknown,
>(
  /** The manifest imported from a generated file. */
  manifest: TManifest,
  /**
   * Additional options for creating the schema.
   *
   * @see https://www.graphql-tools.com/docs/generate-schema#options
   */
  options?: Omit<
    IExecutableSchemaDefinition<TContext>,
    "typeDefs" | "resolvers"
  >,
): GraphQLSchema {
  const typeDefs = Object.values(manifest.modules).map((m) => m.schema).filter((
    schema,
  ): schema is string => !!schema?.trim());

  const [types, directives] = Object.entries(manifest.modules).reduce<
    [Record<string, GraphQLTypeModule>, Record<string, GraphQLDirectiveModule>]
  >(
    ([types, directives], [name, module]) => {
      if (name.startsWith("@")) {
        directives[name] = module as GraphQLDirectiveModule;
      } else {
        types[name] = module as GraphQLTypeModule;
      }

      return [types, directives];
    },
    [{}, {}],
  );

  const resolvers = Object.entries(types).map(
    ([name, { resolver }]): IResolvers | undefined => {
      // Ignore directives
      if (name.startsWith("@") || !resolver) return;

      const resolverObj: IResolvers = {};
      const pathSegments = name.split(".");
      const isSubscription = pathSegments[0] === "Subscription";

      let currentPath = resolverObj;
      while (pathSegments.length > 1) {
        const segment = pathSegments.shift()!;
        currentPath[segment] = {};
        currentPath = currentPath[segment] as Record<never, never>;
      }

      currentPath[pathSegments.shift()!] = isSubscription
        ? { subscribe: resolver }
        : resolver;

      return resolverObj;
    },
  ).filter((resolver): resolver is IResolvers => !!resolver);

  const baseSchema = ["Query", "Mutation", "Subscription"].map((type) => {
    if (typeDefs.some((typeDef) => typeDef?.includes(`extend type ${type}`))) {
      return `type ${type}`;
    }
  }).join("\n");

  const schema = makeExecutableSchema<TContext>({
    ...options,
    typeDefs: [baseSchema, ...typeDefs],
    resolvers,
  });

  // directives
  return Object.entries(directives).reduce(
    (result, [name, { mapper }]) => {
      // Only directives
      if (!name.startsWith("@") || mapper === undefined) return result;

      return mapSchema(result, mapper);
    },
    schema,
  );
}
