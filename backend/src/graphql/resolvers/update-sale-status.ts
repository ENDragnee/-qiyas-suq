import Sale from "@/models/sale";
import type { Context } from "@/types/graphql-context";
import {
  updateSaleStatusSchema,
  type updateSaleStatusInput,
} from "@/schemas/sale.schema";
import Item from "@/models/item";

export async function UpdateSaleStatus(
  _parent: any,
  args: any,
  context: Context,
) {
  try {
    if (!context.user) {
      throw new Error("Unauthorized: User is not logged in");
    }

    const { id: userId } = context.user;

    const validatedArgs: updateSaleStatusInput =
      updateSaleStatusSchema.parse(args);
    const { saleId, status } = validatedArgs;

    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId, userId },
      { $set: { status } },
      { runValidators: true, new: true },
    ).lean();

    if (!updatedSale) {
      return {
        message: "Sale not found or failed to update",
        status: status,
      };
    }

    if (updatedSale.status === "success") {
      const updatedItem = await Item.findOneAndUpdate(
        { _id: updatedSale.itemId, stock: { $gte: updatedSale.quantity } },
        { $inc: { stock: -updatedSale.quantity } },
        { new: true },
      ).lean();

      if (!updatedItem) {
        return {
          message: "Item not found or insufficient stock available",
          status: updatedSale.status,
        };
      }

      return {
        message: "Successfully updated the sales status",
        status: updatedSale.status,
        data: {
          name: updatedItem.name,
          stock: updatedItem.stock,
          description: updatedItem.description,
        },
      };
    }

    return {
      message: "Successfully updated the sales status",
      status: updatedSale.status,
    };
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return {
        message: "Unexpected error has occurred",
        status: "failed",
      };
    }

    return {
      message: "Unexpected error has occurred",
      status: "failed",
      data: err,
    };
  }
}
