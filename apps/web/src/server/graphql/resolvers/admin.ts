import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireAdmin, requireStaff } from '../../auth/rbac';
import { clientIpFromRequest } from '../../audit';
import { getAdminOverview } from '../../admin/overview.service';
import { getAdminAnalytics } from '../../analytics';
import {
  addAdminProductImage,
  deleteAdminProductImage,
  getAdminProduct,
  listAdminProducts,
  listBrands,
  listCategories,
  updateAdminProductImage,
  upsertAdminBrand,
  upsertAdminCategory,
  upsertAdminProduct,
  upsertAdminVariant,
} from '../../catalog';
import {
  getAdminOrder,
  listAdminOrders,
  refundAdminOrder,
  updateAdminOrderStatus,
} from '../../orders/orders.admin';
import {
  listAdminCustomers,
  setCustomerActive,
} from '../../users/users.admin';
import {
  adminAdjustInventory,
  listAdminInventory,
} from '../../inventory';
import {
  listAdminCoupons,
  upsertAdminCoupon,
} from '../../coupons/coupon.admin';
import {
  listAdminBundles,
  upsertAdminBundle,
} from '../../bundles/bundles.service';
import {
  listAdminReviews,
  moderateReview,
} from '../../reviews/reviews.service';
import { listAdminAuditLogs } from '../../audit';
import {
  adjustInventoryArgsSchema,
  adminAnalyticsArgsSchema,
  adminCustomersArgsSchema,
  adminInventoryArgsSchema,
  adminOrdersArgsSchema,
  adminProductArgsSchema,
  adminProductsArgsSchema,
  adminAuditLogsArgsSchema,
  adminReviewsArgsSchema,
  moderateReviewArgsSchema,
  refundAdminOrderArgsSchema,
  setCustomerActiveArgsSchema,
  updateAdminOrderStatusArgsSchema,
  upsertAdminBrandArgsSchema,
  upsertAdminBundleArgsSchema,
  upsertAdminCategoryArgsSchema,
  upsertAdminCouponArgsSchema,
  upsertAdminProductArgsSchema,
  upsertAdminVariantArgsSchema,
  addAdminProductImageArgsSchema,
  updateAdminProductImageArgsSchema,
  deleteAdminProductImageArgsSchema,
} from '../schemas/admin.schema';

function ip(ctx: GraphQLContext) {
  return clientIpFromRequest(ctx.request);
}

export const adminResolvers = {
  Query: {
    adminOverview: async (
      _p: unknown,
      _a: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      return getAdminOverview(ctx.prisma);
    },
    adminAnalytics: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminAnalyticsArgsSchema, args);
      return getAdminAnalytics(ctx.prisma, input ?? {});
    },
    adminProducts: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminProductsArgsSchema, args);
      return listAdminProducts(
        ctx.prisma,
        input ?? { page: 1, pageSize: 20 },
      );
    },
    adminProduct: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { id } = parseOrThrow(adminProductArgsSchema, args);
      return getAdminProduct(ctx.prisma, id);
    },
    adminOrders: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminOrdersArgsSchema, args);
      return listAdminOrders(ctx.prisma, input ?? { page: 1, pageSize: 20 });
    },
    adminOrder: async (_p: unknown, args: unknown, ctx: GraphQLContext) => {
      requireStaff(ctx.user);
      const { id } = parseOrThrow(adminProductArgsSchema, args);
      return getAdminOrder(ctx.prisma, id);
    },
    adminCustomers: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminCustomersArgsSchema, args);
      return listAdminCustomers(
        ctx.prisma,
        input ?? { page: 1, pageSize: 20 },
      );
    },
    adminInventory: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminInventoryArgsSchema, args);
      return listAdminInventory(
        ctx.prisma,
        input ?? { page: 1, pageSize: 20, lowStockOnly: false },
      );
    },
    adminCoupons: async (
      _p: unknown,
      _a: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      return listAdminCoupons(ctx.prisma);
    },
    adminBundles: async (
      _p: unknown,
      _a: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      return listAdminBundles(ctx.prisma);
    },
    adminReviews: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminReviewsArgsSchema, args);
      return listAdminReviews(
        ctx.prisma,
        input ?? { page: 1, pageSize: 20 },
      );
    },
    adminBrands: async (
      _p: unknown,
      _a: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      return listBrands(ctx.prisma);
    },
    adminCategories: async (
      _p: unknown,
      _a: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      return listCategories(ctx.prisma);
    },
    adminAuditLogs: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      requireStaff(ctx.user);
      const { input } = parseOrThrow(adminAuditLogsArgsSchema, args);
      const result = await listAdminAuditLogs(
        ctx.prisma,
        input ?? { page: 1, pageSize: 20 },
      );
      return {
        items: result.items.map((row) => ({
          ...row,
          metadata: row.metadata == null ? null : JSON.stringify(row.metadata),
        })),
        pageInfo: result.pageInfo,
      };
    },
  },
  Mutation: {
    upsertAdminBrand: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminBrandArgsSchema, args);
      return upsertAdminBrand(ctx.prisma, user.id, input, ip(ctx));
    },
    upsertAdminCategory: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminCategoryArgsSchema, args);
      return upsertAdminCategory(ctx.prisma, user.id, input, ip(ctx));
    },
    upsertAdminProduct: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminProductArgsSchema, args);
      return upsertAdminProduct(ctx.prisma, user.id, input, ip(ctx));
    },
    upsertAdminVariant: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminVariantArgsSchema, args);
      return upsertAdminVariant(ctx.prisma, user.id, input, ip(ctx));
    },
    addAdminProductImage: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(addAdminProductImageArgsSchema, args);
      return addAdminProductImage(ctx.prisma, user.id, input, ip(ctx));
    },
    updateAdminProductImage: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(updateAdminProductImageArgsSchema, args);
      return updateAdminProductImage(ctx.prisma, user.id, input, ip(ctx));
    },
    deleteAdminProductImage: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(deleteAdminProductImageArgsSchema, args);
      return deleteAdminProductImage(ctx.prisma, user.id, input, ip(ctx));
    },
    updateAdminOrderStatus: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireStaff(ctx.user);
      const { input } = parseOrThrow(updateAdminOrderStatusArgsSchema, args);
      return updateAdminOrderStatus(ctx.prisma, user.id, input, ip(ctx));
    },
    refundAdminOrder: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(refundAdminOrderArgsSchema, args);
      return refundAdminOrder(ctx.prisma, user.id, input, ip(ctx));
    },
    setCustomerActive: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(setCustomerActiveArgsSchema, args);
      return setCustomerActive(ctx.prisma, user, input, ip(ctx));
    },
    adjustInventory: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(adjustInventoryArgsSchema, args);
      return adminAdjustInventory(ctx.prisma, user.id, input, ip(ctx));
    },
    upsertAdminCoupon: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminCouponArgsSchema, args);
      return upsertAdminCoupon(ctx.prisma, user.id, input, ip(ctx));
    },
    upsertAdminBundle: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireAdmin(ctx.user);
      const { input } = parseOrThrow(upsertAdminBundleArgsSchema, args);
      return upsertAdminBundle(ctx.prisma, user.id, input, ip(ctx));
    },
    moderateReview: async (
      _p: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireStaff(ctx.user);
      const { input } = parseOrThrow(moderateReviewArgsSchema, args);
      return moderateReview(ctx.prisma, user.id, input, ip(ctx));
    },
  },
};
