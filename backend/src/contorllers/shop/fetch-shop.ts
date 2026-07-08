import type { Request, Response, NextFunction } from "express";
import type { GetShopByIdInput } from "@/schemas/shop.schema";
import Shop from "@/models/shop";

export async function GetShop(
  req: Request<GetShopByIdInput["params"], {}, {}, {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id).select("-password");

    return res.status(200).json({
      message: "Successfully fetched a shop",
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
