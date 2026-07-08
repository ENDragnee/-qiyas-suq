import Shop from "@/models/shop";
import type { DeleteShopInput } from "@/schemas/shop.schema";
import type { Request, Response, NextFunction } from "express";

export async function DeleteShop(
  req: Request<{}, {}, DeleteShopInput["body"], {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    const { id } = req.user;

    await Shop.findByIdAndDelete(id).catch((err) => {
      return res.status(400).json({
        message: "Error deleting the shop",
        ...(Bun.env.ENVIRONMENT !== "production" && { data: err }),
      });
    });

    return res.status(204);
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
