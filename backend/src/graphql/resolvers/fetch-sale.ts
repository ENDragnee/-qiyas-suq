import Sale from "@/models/sale";
import type { Context } from "@/types/graphql-context";
import { fetchSaleSchema, type fetchSaleInput } from "@/schemas/sale.schema";

export async function FetchSale(_parent: any, args: any, context: Context) {
  try {
    if (!context.session) {
      throw new Error("Unauthorized: User is not logged in");
    }

    const { id: userId } = context.session;

    const validatedArgs: fetchSaleInput = fetchSaleSchema.parse(args);

    const { saleId } = validatedArgs;

    let queryFilter: Record<string, any> = {};
    queryFilter._id = saleId;

    queryFilter.userId = userId;

    const sale = await Sale.findOne(queryFilter).lean();

    return {
      message: "Successfully fetched sale",
      data: sale,
    };
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return {
        message: "Unexpected error has occured",
      };
    }

    return {
      message: "Unexpected error has occured",
      data: err,
    };
  }
}
