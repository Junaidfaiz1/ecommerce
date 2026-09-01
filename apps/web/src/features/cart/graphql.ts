export const CART_FRAGMENT = `
  id
  lastActivityAt
  updatedAt
  totals {
    subtotal
    discount
    total
    currency
    itemCount
    couponCode
    couponValid
    couponMessage
  }
  items {
    id
    variantId
    quantity
    unitPrice
    lineTotal
    currency
    availableQuantity
    inStock
    product {
      id
      name
      slug
      type
      brandName
      imageUrl
    }
    variant {
      id
      sku
      name
    }
  }
`;

export const CART_QUERY = `
  query Cart {
    cart {
      ${CART_FRAGMENT}
    }
  }
`;

export const ADD_TO_CART = `
  mutation AddToCart($input: AddCartItemInput!) {
    addToCart(input: $input) {
      ${CART_FRAGMENT}
    }
  }
`;

export const UPDATE_CART_ITEM = `
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      ${CART_FRAGMENT}
    }
  }
`;

export const REMOVE_CART_ITEM = `
  mutation RemoveCartItem($input: RemoveCartItemInput!) {
    removeCartItem(input: $input) {
      ${CART_FRAGMENT}
    }
  }
`;

export const CLEAR_CART = `
  mutation ClearCart {
    clearCart {
      ${CART_FRAGMENT}
    }
  }
`;

export const APPLY_COUPON = `
  mutation ApplyCoupon($input: ApplyCouponInput!) {
    applyCoupon(input: $input) {
      ${CART_FRAGMENT}
    }
  }
`;

export const REMOVE_COUPON = `
  mutation RemoveCoupon {
    removeCoupon {
      ${CART_FRAGMENT}
    }
  }
`;

export const ADD_BUILD_TO_CART = `
  mutation AddBuildToCart($input: AddBuildToCartInput!) {
    addBuildToCart(input: $input) {
      ${CART_FRAGMENT}
    }
  }
`;

export type CartProductRef = {
  id: string;
  name: string;
  slug: string;
  type: string;
  brandName: string;
  imageUrl: string | null;
};

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  currency: string;
  availableQuantity: number;
  inStock: boolean;
  product: CartProductRef;
  variant: { id: string; sku: string; name: string | null };
};

export type CartTotals = {
  subtotal: string;
  discount: string;
  total: string;
  currency: string;
  itemCount: number;
  couponCode: string | null;
  couponValid: boolean;
  couponMessage: string | null;
};

export type CartData = {
  id: string;
  items: CartLine[];
  totals: CartTotals;
  lastActivityAt: string;
  updatedAt: string;
};
