import depthLimit from 'graphql-depth-limit';
import { NoSchemaIntrospectionCustomRule } from 'graphql/validation';
import { createYoga, type Plugin, type YogaServerInstance } from 'graphql-yoga';
import { createContext, type GraphQLContext } from './context';
import { maskGraphQLError } from './format-error';
import { schema } from './schema';
import { createRateLimitPlugin } from '../security';
import {
  GRAPHQL_MAX_DEPTH,
  createComplexityLimitRule,
} from './validation-rules';

type YogaApp = YogaServerInstance<object, GraphQLContext>;

const isProd = process.env.NODE_ENV === 'production';

const validationPlugin: Plugin = {
  onValidate({ addValidationRule }) {
    addValidationRule(depthLimit(GRAPHQL_MAX_DEPTH));
    addValidationRule(createComplexityLimitRule());
    if (isProd) {
      addValidationRule(NoSchemaIntrospectionCustomRule);
    }
  },
};

let yogaSingleton: YogaApp | undefined;

export function getYoga(): YogaApp {
  if (!yogaSingleton) {
    yogaSingleton = createYoga<object, GraphQLContext>({
      schema,
      graphqlEndpoint: '/api/graphql',
      fetchAPI: { Response },
      graphiql: !isProd,
      context: createContext,
      plugins: [createRateLimitPlugin(), validationPlugin],
      maskedErrors: {
        maskError(error, message) {
          return maskGraphQLError(error, message);
        },
      },
    });
  }
  return yogaSingleton;
}
