import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GraphQLInputObjectType,
  GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { ForbiddenError } from '../common/errors';
import { adminResolvers } from './resolvers/admin';
import { schema } from './schema';
import { IDS, authUser, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';
import { executeGraphql, testContext } from '../test/graphql';

const gqlSchema = schema as unknown as GraphQLSchema;

function fieldNames(typeName: string): string[] {
  const type = gqlSchema.getType(typeName);
  assert.ok(
    type instanceof GraphQLObjectType || type instanceof GraphQLInputObjectType,
    `Expected GraphQL type ${typeName}`,
  );
  return Object.keys(type.getFields());
}

describe('GraphQL client authority', () => {
  it('does not expose a mutation that marks an order paid', () => {
    const mutations = fieldNames('Mutation');
    for (const name of [
      'markOrderPaid',
      'setOrderPaid',
      'updateOrderStatus',
      'setOrderStatus',
    ]) {
      assert.ok(!mutations.includes(name), `unexpected mutation ${name}`);
    }
    assert.ok(mutations.includes('createCheckoutSession'));
    assert.ok(mutations.includes('cancelPendingOrder'));
  });

  it('does not accept client prices or stock on cart and checkout inputs', () => {
    const cartFields = fieldNames('AddCartItemInput');
    assert.deepEqual([...cartFields].sort(), ['quantity', 'variantId']);

    const checkoutFields = fieldNames('CreateCheckoutInput');
    for (const name of [
      'amount',
      'grandTotal',
      'total',
      'price',
      'unitPrice',
      'quantityOnHand',
    ]) {
      assert.ok(!checkoutFields.includes(name), `unexpected field ${name}`);
    }

    const buildFields = fieldNames('AddBuildToCartInput');
    assert.deepEqual(buildFields, ['buildId']);
  });

  it('rejects customers who try to change fulfillment or inventory via admin mutations', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    const ctx = testContext(prisma, authUser(IDS.customer));

    await assert.rejects(
      () =>
        adminResolvers.Mutation.updateAdminOrderStatus(
          null,
          { input: { id: IDS.compatibleBuild, status: 'PAID' } },
          ctx,
        ),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        adminResolvers.Mutation.adjustInventory(
          null,
          {
            input: {
              variantId: IDS.gpuVar,
              quantityDelta: 99,
              reason: 'test restock',
            },
          },
          ctx,
        ),
      ForbiddenError,
    );

    const result = await executeGraphql(
      `mutation {
        updateAdminOrderStatus(input: { id: "${IDS.compatibleBuild}", status: PAID }) {
          id
        }
      }`,
      ctx,
    );
    assert.equal(result.errors?.[0]?.extensions?.code, 'FORBIDDEN');
  });
});
