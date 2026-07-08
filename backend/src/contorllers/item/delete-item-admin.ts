import Shop from "@/models/shop";
import type { DeleteShopByIdInput } from "@/schemas/shop.schema";
import type { Request, Response, NextFunction } from "express";

export async function DeleteItemAdmin(
  req: Request<DeleteShopByIdInput["params"], {}, {}, {}>,
  res: Response,
  _next: NextFunction,
) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "User is not logged in",
      });
    }

    if (req.user.role != "admin") {
      return res.status(403).json({
        error: "User is not an admin",
      });
    }

    const { id } = req.params;

    const deletedItem = await Shop.findByIdAndDelete(id);

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
