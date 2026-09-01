import { healthResolvers } from './health';
import { authResolvers } from './auth';
import { catalogResolvers } from './catalog';
import { compatibilityResolvers } from './compatibility';
import { builderResolvers } from './builder';
import { performanceResolvers } from './performance';
import { accountResolvers } from './account';
import { storefrontResolvers } from './storefront';
import { threeDResolvers } from './three-d';
import { cartResolvers } from './cart';
import { wishlistResolvers } from './wishlist';
import { checkoutResolvers } from './checkout';
import { orderResolvers } from './orders';
import { adminResolvers } from './admin';

export const resolvers = {
  Query: {
    ...healthResolvers.Query,
    ...authResolvers.Query,
    ...catalogResolvers.Query,
    ...compatibilityResolvers.Query,
    ...builderResolvers.Query,
    ...performanceResolvers.Query,
    ...accountResolvers.Query,
    ...storefrontResolvers.Query,
    ...threeDResolvers.Query,
    ...cartResolvers.Query,
    ...wishlistResolvers.Query,
    ...checkoutResolvers.Query,
    ...orderResolvers.Query,
    ...adminResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...builderResolvers.Mutation,
    ...accountResolvers.Mutation,
    ...storefrontResolvers.Mutation,
    ...cartResolvers.Mutation,
    ...wishlistResolvers.Mutation,
    ...checkoutResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...adminResolvers.Mutation,
  },
};
