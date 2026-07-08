import Sale from "@/models/sale";
import type { Context } from "@/types/graphql-context";
import { fetchSalesSchema, type fetchSalesInput } from "@/schemas/sale.schema";

export async function FetchSales(_parent: any, args: any, context: Context) {
  try {
    if (!context.session) {
      throw new Error("Unauthorized: User is not logged in");
    }

    const { id: userId } = context.session;
    const validatedArgs: fetchSalesInput = fetchSalesSchema.parse(args);

    const { sortBy, limit, page, status, order } = validatedArgs;

    let queryFilter: Record<string, any> = {};

    queryFilter.userId = userId;
    queryFilter.status = status;

    const offset = (page - 1) * limit;

    const [sales, totalDocuments] = await Promise.all([
      Sale.find(queryFilter)
        .limit(limit)
        .skip(offset)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .lean(),
      Sale.countDocuments(queryFilter),
    ]);

    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      data: sales.map((sale) => ({
        ...sale,
        id: sale._id.toString(),
      })),
      metadata: {
        totalDocuments,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
