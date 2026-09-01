import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import {
  getBrandBySlug,
  getCategoryBySlug,
  getProduct,
  getVariantBySku,
  listBrands,
  listCategories,
  listProducts,
} from '../../catalog/catalog.service';
import {
  brandArgsSchema,
  categoryArgsSchema,
  productArgsSchema,
  productsArgsSchema,
  variantArgsSchema,
} from '../schemas/catalog.schema';

export const catalogResolvers = {
  Query: {
    brands: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return listBrands(ctx.prisma);
    },

    brand: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { slug } = parseOrThrow(brandArgsSchema, args);
      return getBrandBySlug(ctx.prisma, slug);
    },

    categories: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return listCategories(ctx.prisma);
    },

    category: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { slug } = parseOrThrow(categoryArgsSchema, args);
      return getCategoryBySlug(ctx.prisma, slug);
    },

    products: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const input = parseOrThrow(productsArgsSchema, args ?? {});
      return listProducts(ctx.prisma, input);
    },

    product: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { id, slug } = parseOrThrow(productArgsSchema, args);
      return getProduct(ctx.prisma, { id, slug });
    },

    productVariant: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { sku } = parseOrThrow(variantArgsSchema, args);
      return getVariantBySku(ctx.prisma, sku);
    },
  },
};
