export const WISHLIST_FRAGMENT = `
  id
  itemCount
  items {
    id
    variantId
    createdAt
    unitPrice
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

export const WISHLIST_QUERY = `
  query Wishlist {
    wishlist {
      ${WISHLIST_FRAGMENT}
    }
  }
`;

export const WISHLIST_CONTAINS = `
  query WishlistContains($variantId: ID!) {
    wishlistContains(variantId: $variantId)
  }
`;

export const ADD_TO_WISHLIST = `
  mutation AddToWishlist($input: AddWishlistItemInput!) {
    addToWishlist(input: $input) {
      ${WISHLIST_FRAGMENT}
    }
  }
`;

export const REMOVE_FROM_WISHLIST = `
  mutation RemoveFromWishlist($input: RemoveWishlistItemInput!) {
    removeFromWishlist(input: $input) {
      ${WISHLIST_FRAGMENT}
    }
  }
`;

export const MOVE_WISHLIST_TO_CART = `
  mutation MoveWishlistItemToCart($input: MoveWishlistItemToCartInput!) {
    moveWishlistItemToCart(input: $input) {
      wishlist {
        ${WISHLIST_FRAGMENT}
      }
      cart {
        id
        totals {
          itemCount
        }
      }
    }
  }
`;

export type WishlistItem = {
  id: string;
  variantId: string;
  createdAt: string;
  unitPrice: string;
  currency: string;
  availableQuantity: number;
  inStock: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    type: string;
    brandName: string;
    imageUrl: string | null;
  };
  variant: { id: string; sku: string; name: string | null };
};

export type WishlistData = {
  id: string;
  items: WishlistItem[];
  itemCount: number;
};
