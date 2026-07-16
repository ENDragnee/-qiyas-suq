import type { Context } from "@/types/graphql-context";
import Sale from "@/models/sale";
import { createSaleSchema, type CreateSaleInput } from "@/schemas/sale.schema";

export async function CreateSale(_parent: any, args: any, context: Context) {
  try {
    if (!context.user) {
      throw new Error("Unauthorized: User is not logged in");
    }

    const { id: userId } = context.user;

    const validatedArgs: CreateSaleInput = createSaleSchema.parse(args);

    const { itemId, price, quantity, code, status } = validatedArgs;

    const saleDoc = await Sale.create({
      userId,
      itemId,
      price,
      quantity,
      code,
      status,
    });

    const createSale = saleDoc.toObject();

    return {
      message: "Sale recorded",
      data: {
        ...createSale,
        id: createSale._id.toString(),
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
