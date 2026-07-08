import { CreateSale } from "./create-sale";
import { FetchSale } from "./fetch-sale";
import { FetchSales } from "./fetch-sales";
import { UpdateSaleStatus } from "./update-sale-status";

export const resolvers = {
  Query: {
    fetchSales: FetchSales,
    fetchSale: FetchSale,
  },

  Mutation: {
    createSale: CreateSale,
    updateSalesStatus: UpdateSaleStatus,
  },
};
