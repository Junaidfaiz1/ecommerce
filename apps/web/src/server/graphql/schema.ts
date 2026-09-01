import { createSchema } from 'graphql-yoga';
import { resolvers } from './resolvers';

export const typeDefs = /* GraphQL */ `
  """
  Liveness / readiness snapshot for the Next.js GraphQL surface.
  """
  type Health {
    status: String!
    service: String!
    timestamp: String!
    database: String
  }

  type ServerInfo {
    name: String!
    version: String!
    environment: String!
    database: String!
  }

  enum UserRole {
    CUSTOMER
    ADMIN
    SUPPORT
  }

  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    emailVerifiedAt: String
    isActive: Boolean!
    createdAt: String!
  }

  enum AddressType {
    SHIPPING
    BILLING
    BOTH
  }

  type Address {
    id: ID!
    label: String
    line1: String!
    line2: String
    city: String!
    state: String
    postalCode: String!
    country: String!
    phone: String
    type: AddressType!
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  enum ReviewStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type ReviewImage {
    id: ID!
    url: String!
    alt: String
  }

  type Review {
    id: ID!
    productId: ID!
    rating: Int!
    title: String
    body: String
    status: ReviewStatus!
    createdAt: String!
    authorName: String!
    images: [ReviewImage!]!
  }

  type ReviewConnection {
    items: [Review!]!
    pageInfo: PageInfo!
    averageRating: Float
  }

  type AuthPayload {
    user: User!
    """Short-lived access JWT (also set as httpOnly cookie)."""
    accessToken: String!
    """Refresh JWT (also set as httpOnly cookie; rotated on refresh)."""
    refreshToken: String!
  }

  type OkPayload {
    ok: Boolean!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String
    lastName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RequestPasswordResetInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  input VerifyEmailInput {
    token: String!
  }

  enum ProductType {
    CPU
    GPU
    MOTHERBOARD
    RAM
    STORAGE
    PSU
    CASE
    COOLER
    ACCESSORY
    OTHER
  }

  enum ProductStatus {
    DRAFT
    ACTIVE
    ARCHIVED
  }

  enum ProductSort {
    NAME_ASC
    NAME_DESC
    PRICE_ASC
    PRICE_DESC
    NEWEST
    FEATURED
  }

  enum StorageInterface {
    NVME_M2
    SATA_SSD
    SATA_HDD
    OTHER
  }

  enum CoolerType {
    AIR
    AIO_LIQUID
    CUSTOM_LOOP
  }

  type Brand {
    id: ID!
    name: String!
    slug: String!
    logoUrl: String
    websiteUrl: String
    description: String
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parentId: ID
    sortOrder: Int!
  }

  type ProductImage {
    id: ID!
    url: String!
    alt: String
    sortOrder: Int!
    isPrimary: Boolean!
  }

  """
  Product GLB / Draco asset. URLs are public CDN (R2) or procedural:// sentinels.
  """
  type Product3DAsset {
    id: ID!
    productId: ID!
    glbUrl: String!
    dracoUrl: String
    posterUrl: String
    label: String
    createdAt: String!
    updatedAt: String!
  }

  type ProductVariant {
    id: ID!
    sku: String!
    name: String
    """Decimal money as string — server authority."""
    price: String!
    compareAtPrice: String
    currency: String!
    isDefault: Boolean!
    isActive: Boolean!
    weightGrams: Int
    """onHand − reserved (display). Checkout re-checks on the server."""
    availableQuantity: Int!
    inStock: Boolean!
    quantityOnHand: Int!
    quantityReserved: Int!
    lowStockThreshold: Int!
  }

  type ProductVariantDetail {
    id: ID!
    sku: String!
    name: String
    price: String!
    compareAtPrice: String
    currency: String!
    isDefault: Boolean!
    isActive: Boolean!
    weightGrams: Int
    availableQuantity: Int!
    inStock: Boolean!
    quantityOnHand: Int!
    quantityReserved: Int!
    lowStockThreshold: Int!
    product: Product!
  }

  type CpuSpec {
    socket: String!
    cores: Int!
    threads: Int!
    baseClockGhz: Float!
    boostClockGhz: Float!
    tdpWatts: Int!
    memoryType: String!
    maxMemoryGhz: Int
    hasIntegratedGpu: Boolean!
  }

  type GpuSpec {
    chipset: String!
    lengthMm: Int!
    slotWidth: Float!
    tdpWatts: Int!
    recommendedPsuWatts: Int
    vramGb: Int!
    powerConnectors: String!
    interfaceBus: String!
  }

  type MotherboardSpec {
    socket: String!
    chipset: String!
    formFactor: String!
    memoryType: String!
    memorySlots: Int!
    maxMemoryGb: Int!
    maxMemorySpeedMhz: Int
    m2Slots: Int!
    sataPorts: Int!
    wifi: Boolean!
  }

  type RamSpec {
    memoryType: String!
    speedMhz: Int!
    capacityGb: Int!
    modules: Int!
    voltage: Float
  }

  type StorageSpec {
    interface: StorageInterface!
    capacityGb: Int!
    formFactor: String!
    readMbps: Int
    writeMbps: Int
  }

  type PsuSpec {
    wattage: Int!
    formFactor: String!
    efficiency: String!
    modular: String!
    lengthMm: Int
  }

  type CaseSpec {
    supportedFormFactors: [String!]!
    maxGpuLengthMm: Int!
    maxCoolerHeightMm: Int!
    psuFormFactor: String!
    maxRadiatorMm: Int
    includedFans: Int!
  }

  type CoolerSpec {
    coolerType: CoolerType!
    supportedSockets: [String!]!
    heightMm: Int
    radiatorMm: Int
    tdpRatingWatts: Int
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    type: ProductType!
    status: ProductStatus!
    isFeatured: Boolean!
    createdAt: String!
    updatedAt: String!
    brand: Brand!
    category: Category!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    defaultVariant: ProductVariant
    cpu: CpuSpec
    gpu: GpuSpec
    motherboard: MotherboardSpec
    ram: RamSpec
    storage: StorageSpec
    psu: PsuSpec
    pcCase: CaseSpec
    cooler: CoolerSpec
  }

  type PageInfo {
    page: Int!
    pageSize: Int!
    totalCount: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type ProductConnection {
    items: [Product!]!
    pageInfo: PageInfo!
  }

  input ProductFilterInput {
    query: String
    type: ProductType
    brandSlug: String
    categorySlug: String
    featured: Boolean
    minPrice: Float
    maxPrice: Float
    inStock: Boolean
  }

  enum ComponentSlot {
    CPU
    GPU
    MOTHERBOARD
    RAM
    STORAGE
    PSU
    CASE
    COOLER
  }

  """
  Server-authoritative compatibility result. Never trust a client-computed
  compatible flag when this query fails or is unreachable.
  """
  type CompatibilityResult {
    compatible: Boolean!
    errors: [String!]!
    warnings: [String!]!
    recommendations: [String!]!
    """Estimated system draw before PSU safety margin (watts)."""
    estimatedWattage: Int
    """Minimum PSU wattage after safety margin."""
    recommendedPsuWatts: Int
  }

  input CompatibilityComponentInput {
    slot: ComponentSlot!
    productId: ID!
    quantity: Int = 1
  }

  input CheckCompatibilityInput {
    components: [CompatibilityComponentInput!]!
  }

  enum BuildVisibility {
    PRIVATE
    UNLISTED
    PUBLIC
  }

  enum GraphicsQuality {
    LOW
    MEDIUM
    HIGH
    ULTRA
  }

  type BuildLineItem {
    slot: ComponentSlot!
    productId: ID!
    productName: String!
    variantId: ID!
    quantity: Int!
    """Decimal money as string — server authority."""
    unitPrice: String!
    lineTotal: String!
  }

  """
  Live price + compatibility for the current selection.
  Never trust client totals or compatible flags.
  """
  type BuildPreview {
    totalPrice: String!
    currency: String!
    lineItems: [BuildLineItem!]!
    compatibility: CompatibilityResult!
  }

  type PCBuildItem {
    id: ID!
    slot: ComponentSlot!
    productId: ID!
    variantId: ID
    quantity: Int!
    productName: String!
    productSlug: String!
    brandName: String!
    imageUrl: String
    unitPrice: String
  }

  type PCBuild {
    id: ID!
    name: String!
    slug: String
    notes: String
    visibility: BuildVisibility!
    totalPriceSnapshot: String
    currency: String!
    createdAt: String!
    updatedAt: String!
    userId: ID
    items: [PCBuildItem!]!
  }

  input BuildComponentInput {
    slot: ComponentSlot!
    productId: ID!
    quantity: Int = 1
    variantId: ID
  }

  input PreviewBuildInput {
    components: [BuildComponentInput!]!
  }

  input SaveBuildInput {
    id: ID
    name: String!
    notes: String
    visibility: BuildVisibility = PRIVATE
    slug: String
    components: [BuildComponentInput!]!
  }

  input DuplicateBuildInput {
    id: ID!
    name: String
  }

  input DeleteBuildInput {
    id: ID!
  }

  type Game {
    id: ID!
    name: String!
    slug: String!
    coverUrl: String
  }

  """
  Benchmark-backed FPS sample. Always labeled as an estimate in the UI.
  """
  type PerformanceEstimate {
    gameId: ID!
    gameName: String!
    gameSlug: String!
    resolution: String!
    quality: GraphicsQuality!
    avgFps: Float!
    isEstimate: Boolean!
    source: String
  }

  type EstimatePerformanceResult {
    estimates: [PerformanceEstimate!]!
    missing: Boolean!
    message: String
  }

  input EstimatePerformanceInput {
    cpuProductId: ID!
    gpuProductId: ID!
    gameId: ID
    gameSlug: String
    resolution: String
    quality: GraphicsQuality
  }

  input CreateAddressInput {
    label: String
    line1: String!
    line2: String
    city: String!
    state: String
    postalCode: String!
    country: String!
    phone: String
    type: AddressType = SHIPPING
    isDefault: Boolean = false
  }

  input UpdateAddressInput {
    id: ID!
    label: String
    line1: String
    line2: String
    city: String
    state: String
    postalCode: String
    country: String
    phone: String
    type: AddressType
    isDefault: Boolean
  }

  input DeleteAddressInput {
    id: ID!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
  }

  input ProductReviewsInput {
    productId: ID
    productSlug: String
    page: Int = 1
    pageSize: Int = 10
  }

  input CreateReviewInput {
    productId: ID!
    rating: Int!
    title: String
    body: String
  }

  input CompareProductsInput {
    ids: [ID!]!
  }

  """
  Server-priced cart line. unitPrice / lineTotal always from DB variants.
  """
  type CartLineItem {
    id: ID!
    variantId: ID!
    quantity: Int!
    unitPrice: String!
    lineTotal: String!
    currency: String!
    availableQuantity: Int!
    inStock: Boolean!
    product: CartProductRef!
    variant: CartVariantRef!
  }

  type CartProductRef {
    id: ID!
    name: String!
    slug: String!
    type: ProductType!
    brandName: String!
    imageUrl: String
  }

  type CartVariantRef {
    id: ID!
    sku: String!
    name: String
  }

  type CartTotals {
    subtotal: String!
    discount: String!
    total: String!
    currency: String!
    itemCount: Int!
    couponCode: String
    couponValid: Boolean!
    couponMessage: String
  }

  type Cart {
    id: ID!
    items: [CartLineItem!]!
    totals: CartTotals!
    lastActivityAt: String!
    updatedAt: String!
  }

  type WishlistItem {
    id: ID!
    variantId: ID!
    createdAt: String!
    unitPrice: String!
    currency: String!
    availableQuantity: Int!
    inStock: Boolean!
    product: CartProductRef!
    variant: CartVariantRef!
  }

  type Wishlist {
    id: ID!
    items: [WishlistItem!]!
    itemCount: Int!
  }

  type MoveWishlistItemToCartPayload {
    wishlist: Wishlist!
    cart: Cart!
  }

  input AddCartItemInput {
    variantId: ID!
    quantity: Int = 1
  }

  input UpdateCartItemInput {
    variantId: ID!
    quantity: Int!
  }

  input RemoveCartItemInput {
    variantId: ID!
  }

  input ApplyCouponInput {
    code: String!
  }

  input AddBuildToCartInput {
    buildId: ID!
  }

  input AddWishlistItemInput {
    variantId: ID!
  }

  input RemoveWishlistItemInput {
    variantId: ID!
  }

  input MoveWishlistItemToCartInput {
    variantId: ID!
    quantity: Int = 1
  }

  """
  Stripe PaymentIntent client secret. Amount comes from the server-created order.
  Paid status is confirmed only by the webhook.
  """
  type CheckoutPayment {
    clientSecret: String!
    orderId: ID!
    orderNumber: String!
    paymentIntentId: String!
  }

  """
  Payment/order status for the success page. Paid only after the Stripe webhook.
  """
  type CheckoutStatus {
    orderId: ID!
    orderNumber: String!
    orderStatus: String!
    paymentStatus: String!
    grandTotal: String!
    currency: String!
    paidAt: String
  }

  input CreateCheckoutInput {
    shippingAddressId: ID
    shippingAddress: CreateAddressInput
    saveAddress: Boolean = false
  }

  enum OrderStatus {
    PENDING_PAYMENT
    PAID
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  type OrderLine {
    id: ID!
    variantId: ID!
    productName: String!
    sku: String!
    unitPrice: String!
    quantity: Int!
    lineTotal: String!
  }

  type Order {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    currency: String!
    subtotal: String!
    discountTotal: String!
    shippingTotal: String!
    taxTotal: String!
    grandTotal: String!
    couponCode: String
    shipName: String!
    shipLine1: String!
    shipLine2: String
    shipCity: String!
    shipState: String
    shipPostalCode: String!
    shipCountry: String!
    shipPhone: String
    paidAt: String
    createdAt: String!
    updatedAt: String!
    paymentStatus: String!
    items: [OrderLine!]!
  }

  type OrderConnection {
    items: [Order!]!
    pageInfo: PageInfo!
  }

  input OrderListInput {
    page: Int = 1
    pageSize: Int = 10
    status: OrderStatus
  }

  enum CouponType {
    PERCENTAGE
    FIXED_AMOUNT
  }

  type AdminOverview {
    pendingPaymentOrders: Int!
    openFulfillmentOrders: Int!
    pendingReviews: Int!
    lowStockVariants: Int!
    activeCustomers: Int!
  }

  """UTC-bucketed series point. value is a decimal string for money, or a count."""
  type AnalyticsDayPoint {
    day: String!
    value: String!
  }

  type AnalyticsCountPoint {
    key: String!
    count: Int!
  }

  type AnalyticsKpis {
    paidOrders: Int!
    grossRevenue: String!
    refundedTotal: String!
    netRevenue: String!
    averageOrderValue: String!
    buildsCreated: Int!
    abandonedStarted: Int!
    recovered: Int!
    recoveryRate: Float!
    emailsSent: Int!
    emailsClicked: Int!
    clickRate: Float!
  }

  type TopBuildProduct {
    productId: ID!
    productName: String!
    slot: String!
    count: Int!
  }

  type AbandonedFunnel {
    started: Int!
    emailed: Int!
    clicked: Int!
    recovered: Int!
    expired: Int!
  }

  """
  Staff analytics for a closed UTC window. Money and rates are computed on the server.
  """
  type AdminAnalytics {
    range: String!
    from: String!
    to: String!
    kpis: AnalyticsKpis!
    revenueByDay: [AnalyticsDayPoint!]!
    ordersByStatus: [AnalyticsCountPoint!]!
    buildsByDay: [AnalyticsDayPoint!]!
    buildsByVisibility: [AnalyticsCountPoint!]!
    topBuildProducts: [TopBuildProduct!]!
    abandonedByStatus: [AnalyticsCountPoint!]!
    abandonedFunnel: AbandonedFunnel!
  }

  input AdminAnalyticsInput {
    """7d, 30d, or 90d (default 30d)."""
    range: String = "30d"
  }

  input AdminProductListInput {
    page: Int = 1
    pageSize: Int = 20
    query: String
    type: ProductType
    status: ProductStatus
  }

  input AdminCpuInput {
    socket: String!
    cores: Int!
    threads: Int!
    baseClockGhz: Float!
    boostClockGhz: Float!
    tdpWatts: Int!
    memoryType: String!
    maxMemoryGhz: Int
    hasIntegratedGpu: Boolean = false
  }

  input AdminGpuInput {
    chipset: String!
    lengthMm: Int!
    slotWidth: Float = 2
    tdpWatts: Int!
    recommendedPsuWatts: Int
    vramGb: Int!
    powerConnectors: String!
    interfaceBus: String = "PCIe 4.0 x16"
  }

  input AdminMotherboardInput {
    socket: String!
    chipset: String!
    formFactor: String!
    memoryType: String!
    memorySlots: Int!
    maxMemoryGb: Int!
    maxMemorySpeedMhz: Int
    m2Slots: Int = 0
    sataPorts: Int = 0
    wifi: Boolean = false
  }

  input AdminRamInput {
    memoryType: String!
    speedMhz: Int!
    capacityGb: Int!
    modules: Int = 2
    voltage: Float
  }

  input AdminStorageInput {
    interface: StorageInterface!
    capacityGb: Int!
    formFactor: String!
    readMbps: Int
    writeMbps: Int
  }

  input AdminPsuInput {
    wattage: Int!
    formFactor: String!
    efficiency: String!
    modular: String!
    lengthMm: Int
  }

  input AdminCaseInput {
    supportedFormFactors: [String!]!
    maxGpuLengthMm: Int!
    maxCoolerHeightMm: Int!
    psuFormFactor: String!
    maxRadiatorMm: Int
    includedFans: Int = 0
  }

  input AdminCoolerInput {
    coolerType: CoolerType!
    supportedSockets: [String!]!
    heightMm: Int
    radiatorMm: Int
    tdpRatingWatts: Int
  }

  input UpsertAdminBrandInput {
    id: ID
    name: String!
    slug: String!
    logoUrl: String
    websiteUrl: String
    description: String
  }

  input UpsertAdminCategoryInput {
    id: ID
    name: String!
    slug: String!
    description: String
    parentId: ID
    sortOrder: Int = 0
  }

  input UpsertAdminProductInput {
    id: ID
    brandId: ID!
    categoryId: ID!
    type: ProductType!
    name: String!
    slug: String!
    description: String
    status: ProductStatus = DRAFT
    isFeatured: Boolean = false
    cpu: AdminCpuInput
    gpu: AdminGpuInput
    motherboard: AdminMotherboardInput
    ram: AdminRamInput
    storage: AdminStorageInput
    psu: AdminPsuInput
    pcCase: AdminCaseInput
    cooler: AdminCoolerInput
  }

  input UpsertAdminVariantInput {
    id: ID
    productId: ID!
    sku: String!
    name: String
    price: String!
    compareAtPrice: String
    currency: String = "USD"
    isDefault: Boolean = false
    isActive: Boolean = true
    weightGrams: Int
    quantityOnHand: Int
    lowStockThreshold: Int
  }

  type AdminOrder {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    currency: String!
    subtotal: String!
    discountTotal: String!
    shippingTotal: String!
    taxTotal: String!
    grandTotal: String!
    couponCode: String
    shipName: String!
    shipLine1: String!
    shipLine2: String
    shipCity: String!
    shipState: String
    shipPostalCode: String!
    shipCountry: String!
    shipPhone: String
    paidAt: String
    createdAt: String!
    updatedAt: String!
    paymentStatus: String!
    userId: ID!
    customerEmail: String!
    refundedTotal: String!
    items: [OrderLine!]!
  }

  type AdminOrderConnection {
    items: [AdminOrder!]!
    pageInfo: PageInfo!
  }

  input AdminOrderListInput {
    page: Int = 1
    pageSize: Int = 20
    query: String
    status: OrderStatus
  }

  input UpdateAdminOrderStatusInput {
    id: ID!
    status: OrderStatus!
  }

  input RefundAdminOrderInput {
    orderId: ID!
    amount: String!
    reason: String
    restock: Boolean = false
  }

  type AdminCustomer {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    emailVerifiedAt: String
    isActive: Boolean!
    createdAt: String!
    orderCount: Int!
  }

  type AdminCustomerConnection {
    items: [AdminCustomer!]!
    pageInfo: PageInfo!
  }

  input AdminCustomerListInput {
    page: Int = 1
    pageSize: Int = 20
    query: String
    isActive: Boolean
  }

  input SetCustomerActiveInput {
    userId: ID!
    isActive: Boolean!
  }

  type AdminInventoryRow {
    inventoryId: ID!
    variantId: ID!
    productId: ID!
    productName: String!
    sku: String!
    onHand: Int!
    reserved: Int!
    available: Int!
    lowStockThreshold: Int!
    isLow: Boolean!
  }

  type AdminInventoryConnection {
    items: [AdminInventoryRow!]!
    pageInfo: PageInfo!
  }

  input AdminInventoryListInput {
    page: Int = 1
    pageSize: Int = 20
    query: String
    lowStockOnly: Boolean = false
  }

  input AdjustInventoryInput {
    variantId: ID!
    quantityDelta: Int!
    reason: String!
    lowStockThreshold: Int
  }

  type AdminCoupon {
    id: ID!
    code: String!
    type: CouponType!
    value: String!
    minSubtotal: String
    maxDiscount: String
    maxUses: Int
    maxUsesPerUser: Int
    startsAt: String
    endsAt: String
    isActive: Boolean!
    usageCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  input UpsertAdminCouponInput {
    id: ID
    code: String!
    type: CouponType!
    value: Float!
    minSubtotal: Float
    maxDiscount: Float
    maxUses: Int
    maxUsesPerUser: Int
    startsAt: String
    endsAt: String
    isActive: Boolean = true
  }

  type AdminBundleItem {
    id: ID!
    productId: ID!
    variantId: ID!
    quantity: Int!
    productName: String!
    sku: String!
  }

  type AdminBundle {
    id: ID!
    name: String!
    slug: String!
    description: String
    status: ProductStatus!
    bundlePrice: String
    createdAt: String!
    updatedAt: String!
    items: [AdminBundleItem!]!
  }

  input AdminBundleItemInput {
    variantId: ID!
    quantity: Int!
  }

  input UpsertAdminBundleInput {
    id: ID
    name: String!
    slug: String!
    description: String
    status: ProductStatus = DRAFT
    bundlePrice: String
    items: [AdminBundleItemInput!]!
  }

  type AdminReview {
    id: ID!
    productId: ID!
    productName: String!
    userId: ID!
    rating: Int!
    title: String
    body: String
    status: ReviewStatus!
    createdAt: String!
    authorName: String!
    images: [ReviewImage!]!
  }

  type AdminReviewConnection {
    items: [AdminReview!]!
    pageInfo: PageInfo!
  }

  input AdminReviewListInput {
    page: Int = 1
    pageSize: Int = 20
    status: ReviewStatus
  }

  input ModerateReviewInput {
    id: ID!
    status: ReviewStatus!
  }

  type AdminAuditLog {
    id: ID!
    action: String!
    entityType: String!
    entityId: ID
    metadata: String
    ip: String
    createdAt: String!
    actorUserId: ID
    actorEmail: String
  }

  type AdminAuditLogConnection {
    items: [AdminAuditLog!]!
    pageInfo: PageInfo!
  }

  input AdminAuditLogListInput {
    page: Int = 1
    pageSize: Int = 20
    action: String
    entityType: String
    actorUserId: ID
  }

  type Query {
    health: Health!
    """Echo string (Zod-validated) or default pong."""
    ping(echo: String): String!
    """Foundation probe — Prisma context + env."""
    serverInfo: ServerInfo!
    """Authenticated user, or null if anonymous."""
    me: User

    brands: [Brand!]!
    brand(slug: String!): Brand!
    categories: [Category!]!
    category(slug: String!): Category!
    """Public ACTIVE catalog with search, filters, sort, pagination."""
    products(
      filter: ProductFilterInput
      sort: ProductSort = FEATURED
      page: Int = 1
      pageSize: Int = 24
    ): ProductConnection!
    """Public product by id or slug (exactly one)."""
    product(id: ID, slug: String): Product!
    """Active variant by SKU (includes parent product)."""
    productVariant(sku: String!): ProductVariantDetail!

    """
    Evaluate build compatibility from product IDs (typed hardware on server).
    """
    checkCompatibility(input: CheckCompatibilityInput!): CompatibilityResult!

    """Server price + compatibility for the current PC Builder selection."""
    previewBuild(input: PreviewBuildInput!): BuildPreview!
    """Authenticated user's saved builds."""
    myBuilds: [PCBuild!]!
    """Load a build by id or slug (private builds require owner)."""
    build(id: ID, slug: String): PCBuild!

    games: [Game!]!
    """Benchmark-based FPS estimates for a CPU + GPU pair."""
    estimatePerformance(input: EstimatePerformanceInput!): EstimatePerformanceResult!

    """Authenticated user's saved addresses."""
    myAddresses: [Address!]!
    """Approved reviews for a product (public)."""
    productReviews(input: ProductReviewsInput!): ReviewConnection!
    """Load ACTIVE products by id for comparison (max 4)."""
    compareProducts(input: CompareProductsInput!): [Product!]!

    """3D assets for an ACTIVE product (exactly one of productId / productSlug)."""
    product3DAssets(productId: ID, productSlug: String): [Product3DAsset!]!
    """Preferred viewer asset, or procedural fallback when none uploaded."""
    productViewerAsset(productId: ID, productSlug: String): Product3DAsset!

    """Current cart for the signed-in user or guest session cookie."""
    cart: Cart
    """Authenticated wishlist (empty list if none)."""
    wishlist: Wishlist!
    """Whether the authenticated wishlist contains a variant."""
    wishlistContains(variantId: ID!): Boolean!
    """
    Status of a checkout the current user owns. Never treat redirect success as paid.
    """
    checkoutStatus(paymentIntentId: String, orderId: ID): CheckoutStatus!
    """Authenticated customer's orders (paginated)."""
    myOrders(input: OrderListInput): OrderConnection!
    """Load one order owned by the current user."""
    order(id: ID!): Order!
    """Staff ops snapshot (live counts)."""
    adminOverview: AdminOverview!
    """Staff KPIs + series for 7d / 30d / 90d (server-computed)."""
    adminAnalytics(input: AdminAnalyticsInput): AdminAnalytics!
    adminBrands: [Brand!]!
    adminCategories: [Category!]!
    adminProducts(input: AdminProductListInput): ProductConnection!
    adminProduct(id: ID!): Product!
    adminOrders(input: AdminOrderListInput): AdminOrderConnection!
    adminOrder(id: ID!): AdminOrder!
    adminCustomers(input: AdminCustomerListInput): AdminCustomerConnection!
    adminInventory(input: AdminInventoryListInput): AdminInventoryConnection!
    adminCoupons: [AdminCoupon!]!
    adminBundles: [AdminBundle!]!
    adminReviews(input: AdminReviewListInput): AdminReviewConnection!
    """Staff-only audit trail (sanitized metadata)."""
    adminAuditLogs(input: AdminAuditLogListInput): AdminAuditLogConnection!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: OkPayload!
    """Rotate refresh cookie / issue new access token."""
    refreshAuth: AuthPayload!
    requestPasswordReset(input: RequestPasswordResetInput!): OkPayload!
    resetPassword(input: ResetPasswordInput!): OkPayload!
    verifyEmail(input: VerifyEmailInput!): User!
    resendVerificationEmail: OkPayload!

    """Create or update a saved PC build (auth required)."""
    saveBuild(input: SaveBuildInput!): PCBuild!
    """Duplicate a visible build into the current user's private builds."""
    duplicateBuild(input: DuplicateBuildInput!): PCBuild!
    """Delete a build owned by the current user."""
    deleteBuild(input: DeleteBuildInput!): OkPayload!

    updateProfile(input: UpdateProfileInput!): User!
    createAddress(input: CreateAddressInput!): Address!
    updateAddress(input: UpdateAddressInput!): Address!
    deleteAddress(input: DeleteAddressInput!): OkPayload!
    """Submit a product review (PENDING until moderation)."""
    createReview(input: CreateReviewInput!): Review!

    addToCart(input: AddCartItemInput!): Cart!
    updateCartItem(input: UpdateCartItemInput!): Cart!
    removeCartItem(input: RemoveCartItemInput!): Cart!
    clearCart: Cart!
    applyCoupon(input: ApplyCouponInput!): Cart!
    removeCoupon: Cart!
    """Add every component from a saved build (blocks on hard incompatibilities)."""
    addBuildToCart(input: AddBuildToCartInput!): Cart!

    addToWishlist(input: AddWishlistItemInput!): Wishlist!
    removeFromWishlist(input: RemoveWishlistItemInput!): Wishlist!
    moveWishlistItemToCart(input: MoveWishlistItemToCartInput!): MoveWishlistItemToCartPayload!

    """
    Snapshot the cart into a PENDING_PAYMENT order and return a PaymentIntent client secret.
    """
    createCheckoutSession(input: CreateCheckoutInput!): CheckoutPayment!
    """Cancel a PENDING_PAYMENT order owned by the current user (releases stock)."""
    cancelPendingOrder(id: ID!): Order!
    upsertAdminBrand(input: UpsertAdminBrandInput!): Brand!
    upsertAdminCategory(input: UpsertAdminCategoryInput!): Category!
    upsertAdminProduct(input: UpsertAdminProductInput!): Product!
    upsertAdminVariant(input: UpsertAdminVariantInput!): Product!
    updateAdminOrderStatus(input: UpdateAdminOrderStatusInput!): AdminOrder!
    refundAdminOrder(input: RefundAdminOrderInput!): AdminOrder!
    setCustomerActive(input: SetCustomerActiveInput!): User!
    adjustInventory(input: AdjustInventoryInput!): AdminInventoryRow!
    upsertAdminCoupon(input: UpsertAdminCouponInput!): AdminCoupon!
    upsertAdminBundle(input: UpsertAdminBundleInput!): AdminBundle!
    moderateReview(input: ModerateReviewInput!): AdminReview!
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers,
});
