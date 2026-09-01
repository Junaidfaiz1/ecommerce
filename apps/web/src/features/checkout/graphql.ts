export const CHECKOUT_CART_QUERY = `
  query CheckoutCart {
    me { id email firstName lastName }
    cart {
      id
      totals {
        subtotal
        discount
        total
        currency
        itemCount
        couponCode
        couponValid
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
        product { id name slug type brandName imageUrl }
        variant { id sku name }
      }
    }
    myAddresses {
      id
      label
      line1
      line2
      city
      state
      postalCode
      country
      phone
      type
      isDefault
    }
  }
`;

export const CREATE_CHECKOUT_SESSION = `
  mutation CreateCheckoutSession($input: CreateCheckoutInput!) {
    createCheckoutSession(input: $input) {
      clientSecret
      orderId
      orderNumber
      paymentIntentId
    }
  }
`;

export const CHECKOUT_STATUS = `
  query CheckoutStatus($paymentIntentId: String, $orderId: ID) {
    checkoutStatus(paymentIntentId: $paymentIntentId, orderId: $orderId) {
      orderId
      orderNumber
      orderStatus
      paymentStatus
      grandTotal
      currency
      paidAt
    }
  }
`;

export type CheckoutAddress = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  type: string;
  isDefault: boolean;
};

export type CheckoutCartLine = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
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

export type CheckoutCart = {
  id: string;
  totals: {
    subtotal: string;
    discount: string;
    total: string;
    currency: string;
    itemCount: number;
    couponCode: string | null;
    couponValid: boolean;
  };
  items: CheckoutCartLine[];
};

export type CheckoutPaymentData = {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
};

export type CheckoutStatusData = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  grandTotal: string;
  currency: string;
  paidAt: string | null;
};
