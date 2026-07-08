import type { Request, Response, NextFunction } from "express";
import type { DeleteItemByIdInput } from "@/schemas/item.schema";
import Item from "@/models/item";

export async function DeleteItem(
  req: Request<DeleteItemByIdInput["params"], {}, {}, {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { shopId } = req.user;
    const { id: itemId } = req.params;

    const deletedItem = await Item.findOneAndDelete({
      _id: itemId,
      shopId,
    });

    if (!deletedItem) {
      return res.status(404).json({
        message: "Item not found or you do not have permission to delete it",
      });
    }

    return res.status(204).send();
  } catch (err) {
    if (Bun.env.ENVIRONMENT === "production") {
      return res.status(500).json({
        message: "Unexpected error has occured",
      });
    }

    return res.status(500).json({
      message: "Unexpected error has occured",
      data: err,
    });
  }
}
