export const MY_ORDERS_QUERY = `
  query MyOrders($input: OrderListInput) {
    myOrders(input: $input) {
      items {
        id
        orderNumber
        status
        currency
        grandTotal
        createdAt
        paidAt
        paymentStatus
        items {
          id
          productName
          quantity
        }
      }
      pageInfo {
        page
        pageSize
        totalCount
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const ORDER_QUERY = `
  query AccountOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      currency
      subtotal
      discountTotal
      shippingTotal
      taxTotal
      grandTotal
      couponCode
      shipName
      shipLine1
      shipLine2
      shipCity
      shipState
      shipPostalCode
      shipCountry
      shipPhone
      paidAt
      createdAt
      updatedAt
      paymentStatus
      items {
        id
        variantId
        productName
        sku
        unitPrice
        quantity
        lineTotal
      }
    }
  }
`;

export const CANCEL_PENDING_ORDER = `
  mutation CancelPendingOrder($id: ID!) {
    cancelPendingOrder(id: $id) {
      id
      status
      paymentStatus
    }
  }
`;

export type OrderLine = {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  grandTotal: string;
  createdAt: string;
  paidAt: string | null;
  paymentStatus: string;
  items: Array<{ id: string; productName: string; quantity: number }>;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  couponCode: string | null;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string | null;
  shipPostalCode: string;
  shipCountry: string;
  shipPhone: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string;
  items: OrderLine[];
};

export type PageInfo = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type OrderConnection = {
  items: OrderSummary[];
  pageInfo: PageInfo;
};
