import type { Request, Response, NextFunction } from "express";
import type { GetItemByIdInput } from "@/schemas/item.schema";
import Item from "@/models/item";

export async function GetItem(
  req: Request<GetItemByIdInput["params"], {}, {}, {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    const { id } = req.params;

    const shop = await Item.findById(id).lean();

    return res.status(200).json({
      message: "Successfully fetched an item",
      data: shop,
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
