export const typeDefs = `#graphql
  type ISale {
    id: String
    itemId: String
    price: Float
    quantity: Int
    code: String
    status: String
  }

  type FetchSale {
    message: String!
    data: ISale!
  }

  type SaleMetadata {
    totalDocuments: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  type Sale {
    data: [ISale]
    metadata: SaleMetadata
  }

  type Query {
    fetchSales(
      page: Int = 1
      limit: Int = 10
      search: String
      sortBy: String = "createdAt"
      order: String = "asc"
      status: String = "success"
    ): Sale

    fetchSale(saleId: String!): FetchSale!
  }

  type CreateSale {
    message: String!
    data: ISale
  }

  type IItem {
    name: String!
    stock: Int!
    description: String
  }

  type UpdateSaleStatus {
    message: String!
    staus: String!
    data: IItem
  }

  type Mutation {
    createSale(
      itemId: String!
      price: Float!
      quantity: Int!
      status: String = "pending"
      code: String!
    ): CreateSale!

    updateSalesStatus(
      saleId: String!
      status: String = "failed"
    ): UpdateSaleStatus! 
  }
`;
