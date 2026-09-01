import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import {
  getProductViewerAsset,
  listProduct3DAssets,
} from '../../three-d-assets';
import { product3DAssetsQuerySchema } from '../schemas/three-d.schema';

export const threeDResolvers = {
  Query: {
    product3DAssets: async (
      _parent: unknown,
      args: { productId?: string; productSlug?: string },
      ctx: GraphQLContext,
    ) => {
      const input = parseOrThrow(product3DAssetsQuerySchema, args);
      return listProduct3DAssets(ctx.prisma, input);
    },
    productViewerAsset: async (
      _parent: unknown,
      args: { productId?: string; productSlug?: string },
      ctx: GraphQLContext,
    ) => {
      const input = parseOrThrow(product3DAssetsQuerySchema, args);
      return getProductViewerAsset(ctx.prisma, input);
    },
  },
};
