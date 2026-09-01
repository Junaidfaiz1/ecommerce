export const ADMIN_ME = `
  query AdminMe {
    me { id email firstName lastName role }
  }
`;

export const ADMIN_OVERVIEW = `
  query AdminOverview {
    adminOverview {
      pendingPaymentOrders
      openFulfillmentOrders
      pendingReviews
      lowStockVariants
      activeCustomers
    }
  }
`;

export const ADMIN_DASHBOARD = `
  query AdminDashboard($input: AdminAnalyticsInput) {
    adminOverview {
      pendingPaymentOrders
      openFulfillmentOrders
      pendingReviews
      lowStockVariants
      activeCustomers
    }
    adminAnalytics(input: $input) {
      range
      from
      to
      kpis {
        paidOrders
        grossRevenue
        refundedTotal
        netRevenue
        averageOrderValue
        buildsCreated
        abandonedStarted
        recovered
        recoveryRate
        emailsSent
        emailsClicked
        clickRate
      }
      revenueByDay { day value }
      ordersByStatus { key count }
      buildsByDay { day value }
      buildsByVisibility { key count }
      topBuildProducts { productId productName slot count }
      abandonedByStatus { key count }
      abandonedFunnel { started emailed clicked recovered expired }
    }
  }
`;

export const ADMIN_PRODUCTS = `
  query AdminProducts($input: AdminProductListInput) {
    adminProducts(input: $input) {
      items {
        id name slug type status isFeatured
        brand { id name }
        category { id name }
        defaultVariant { price currency sku }
      }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;

export const ADMIN_PRODUCT = `
  query AdminProduct($id: ID!) {
    adminProduct(id: $id) {
      id name slug description type status isFeatured
      brand { id name slug }
      category { id name slug }
      cpu { socket cores threads baseClockGhz boostClockGhz tdpWatts memoryType maxMemoryGhz hasIntegratedGpu }
      gpu { chipset lengthMm slotWidth tdpWatts recommendedPsuWatts vramGb powerConnectors interfaceBus }
      motherboard { socket chipset formFactor memoryType memorySlots maxMemoryGb maxMemorySpeedMhz m2Slots sataPorts wifi }
      ram { memoryType speedMhz capacityGb modules voltage }
      storage { interface capacityGb formFactor readMbps writeMbps }
      psu { wattage formFactor efficiency modular lengthMm }
      pcCase { supportedFormFactors maxGpuLengthMm maxCoolerHeightMm psuFormFactor maxRadiatorMm includedFans }
      cooler { coolerType supportedSockets heightMm radiatorMm tdpRatingWatts }
      variants {
        id sku name price compareAtPrice currency isDefault isActive
        quantityOnHand quantityReserved lowStockThreshold availableQuantity
      }
    }
    adminBrands { id name slug }
    adminCategories { id name slug }
  }
`;

export const ADMIN_CATALOG_META = `
  query AdminCatalogMeta {
    adminBrands { id name slug }
    adminCategories { id name slug }
  }
`;

export const UPSERT_ADMIN_PRODUCT = `
  mutation UpsertAdminProduct($input: UpsertAdminProductInput!) {
    upsertAdminProduct(input: $input) { id slug }
  }
`;

export const UPSERT_ADMIN_VARIANT = `
  mutation UpsertAdminVariant($input: UpsertAdminVariantInput!) {
    upsertAdminVariant(input: $input) { id }
  }
`;

export const UPSERT_ADMIN_BRAND = `
  mutation UpsertAdminBrand($input: UpsertAdminBrandInput!) {
    upsertAdminBrand(input: $input) { id name slug }
  }
`;

export const UPSERT_ADMIN_CATEGORY = `
  mutation UpsertAdminCategory($input: UpsertAdminCategoryInput!) {
    upsertAdminCategory(input: $input) { id name slug }
  }
`;

export const ADMIN_ORDERS = `
  query AdminOrders($input: AdminOrderListInput) {
    adminOrders(input: $input) {
      items {
        id orderNumber status grandTotal currency customerEmail createdAt paymentStatus
      }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;

export const ADMIN_ORDER = `
  query AdminOrder($id: ID!) {
    adminOrder(id: $id) {
      id orderNumber status currency subtotal discountTotal shippingTotal taxTotal
      grandTotal couponCode shipName shipLine1 shipLine2 shipCity shipState
      shipPostalCode shipCountry shipPhone paidAt createdAt paymentStatus
      customerEmail refundedTotal
      items { id productName sku quantity unitPrice lineTotal }
    }
  }
`;

export const UPDATE_ADMIN_ORDER_STATUS = `
  mutation UpdateAdminOrderStatus($input: UpdateAdminOrderStatusInput!) {
    updateAdminOrderStatus(input: $input) { id status }
  }
`;

export const REFUND_ADMIN_ORDER = `
  mutation RefundAdminOrder($input: RefundAdminOrderInput!) {
    refundAdminOrder(input: $input) { id status refundedTotal paymentStatus }
  }
`;

export const ADMIN_CUSTOMERS = `
  query AdminCustomers($input: AdminCustomerListInput) {
    adminCustomers(input: $input) {
      items { id email firstName lastName role isActive createdAt orderCount }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;

export const SET_CUSTOMER_ACTIVE = `
  mutation SetCustomerActive($input: SetCustomerActiveInput!) {
    setCustomerActive(input: $input) { id isActive }
  }
`;

export const ADMIN_INVENTORY = `
  query AdminInventory($input: AdminInventoryListInput) {
    adminInventory(input: $input) {
      items {
        inventoryId variantId productId productName sku
        onHand reserved available lowStockThreshold isLow
      }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;

export const ADJUST_INVENTORY = `
  mutation AdjustInventory($input: AdjustInventoryInput!) {
    adjustInventory(input: $input) {
      variantId onHand reserved available lowStockThreshold isLow
    }
  }
`;

export const ADMIN_COUPONS = `
  query AdminCoupons {
    adminCoupons {
      id code type value minSubtotal maxDiscount maxUses maxUsesPerUser
      startsAt endsAt isActive usageCount
    }
  }
`;

export const UPSERT_ADMIN_COUPON = `
  mutation UpsertAdminCoupon($input: UpsertAdminCouponInput!) {
    upsertAdminCoupon(input: $input) { id code }
  }
`;

export const ADMIN_BUNDLES = `
  query AdminBundles {
    adminBundles {
      id name slug status bundlePrice
      items { id variantId quantity productName sku }
    }
  }
`;

export const UPSERT_ADMIN_BUNDLE = `
  mutation UpsertAdminBundle($input: UpsertAdminBundleInput!) {
    upsertAdminBundle(input: $input) { id slug }
  }
`;

export const ADMIN_REVIEWS = `
  query AdminReviews($input: AdminReviewListInput) {
    adminReviews(input: $input) {
      items {
        id productId productName rating title body status createdAt authorName
      }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;

export const MODERATE_REVIEW = `
  mutation ModerateReview($input: ModerateReviewInput!) {
    moderateReview(input: $input) { id status }
  }
`;

export const ADMIN_AUDIT_LOGS = `
  query AdminAuditLogs($input: AdminAuditLogListInput) {
    adminAuditLogs(input: $input) {
      items {
        id action entityType entityId metadata ip createdAt actorUserId actorEmail
      }
      pageInfo { page pageSize totalCount totalPages hasNextPage hasPreviousPage }
    }
  }
`;
