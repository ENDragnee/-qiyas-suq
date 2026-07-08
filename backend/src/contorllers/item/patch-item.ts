import type { Request, Response, NextFunction } from "express";
import type { PatchItemInput } from "@/schemas/item.schema";
import Item from "@/models/item";

export async function PatchItem(
  req: Request<PatchItemInput["params"], {}, PatchItemInput["body"], {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { shopId } = req.user;
    const { name, image, description, price, stock } = req.body;
    const { id: itemId } = req.params;

    const patchedItem = await Item.findOneAndUpdate(
      { _id: itemId, shopId },
      {
        ...(name && { name }),
        ...(image && { image }),
        ...(description && { description }),
        ...(price && { price }),
        ...(stock && { stock }),
      },
      { new: true, runValidators: true },
    ).lean();

    if (!patchedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json({
      message: "Succesfuly updated the item",
      data: patchedItem,
    });
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
