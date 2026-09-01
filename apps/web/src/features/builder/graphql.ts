export const PREVIEW_BUILD_QUERY = `
  query PreviewBuild($input: PreviewBuildInput!) {
    previewBuild(input: $input) {
      totalPrice
      currency
      lineItems {
        slot
        productId
        productName
        variantId
        quantity
        unitPrice
        lineTotal
      }
      compatibility {
        compatible
        errors
        warnings
        recommendations
        estimatedWattage
        recommendedPsuWatts
      }
    }
  }
`;

export const PRODUCTS_FOR_SLOT_QUERY = `
  query ProductsForSlot($type: ProductType!, $pageSize: Int) {
    products(filter: { type: $type }, sort: FEATURED, page: 1, pageSize: $pageSize) {
      items {
        id
        name
        slug
        type
        brand { name }
        images { url isPrimary }
        defaultVariant {
          id
          price
          currency
          inStock
          availableQuantity
        }
      }
    }
  }
`;

export const ESTIMATE_PERFORMANCE_QUERY = `
  query EstimatePerformance($input: EstimatePerformanceInput!) {
    estimatePerformance(input: $input) {
      missing
      message
      estimates {
        gameId
        gameName
        gameSlug
        resolution
        quality
        avgFps
        isEstimate
        source
      }
    }
  }
`;

export const SAVE_BUILD_MUTATION = `
  mutation SaveBuild($input: SaveBuildInput!) {
    saveBuild(input: $input) {
      id
      name
      slug
      visibility
      totalPriceSnapshot
      currency
      updatedAt
    }
  }
`;

export const BUILD_QUERY = `
  query GetBuild($id: ID, $slug: String) {
    build(id: $id, slug: $slug) {
      id
      name
      slug
      notes
      visibility
      totalPriceSnapshot
      currency
      items {
        id
        slot
        productId
        variantId
        quantity
        productName
        productSlug
        brandName
        imageUrl
        unitPrice
      }
    }
  }
`;

export const MY_BUILDS_QUERY = `
  query MyBuilds {
    myBuilds {
      id
      name
      slug
      visibility
      totalPriceSnapshot
      currency
      updatedAt
      items { slot productName }
    }
  }
`;

export const DUPLICATE_BUILD_MUTATION = `
  mutation DuplicateBuild($input: DuplicateBuildInput!) {
    duplicateBuild(input: $input) {
      id
      name
    }
  }
`;

export const ME_QUERY = `
  query BuilderMe {
    me { id email }
  }
`;
