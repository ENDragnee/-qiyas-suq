import { HashPassword } from "@/libs/password-utils";
import Shop from "@/models/shop";
import type { PatchShopInput } from "@/schemas/shop.schema";
import type { Request, Response, NextFunction } from "express";

export async function PatchShop(
  req: Request<{}, {}, PatchShopInput["body"], {}>,
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
    const { name, accounts, password, banner } = req.body;
    let hashedPassword = "";
    if (password) {
      hashedPassword = await HashPassword(password);
    }

    const patchedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        ...(name && { name }),
        ...(accounts && { accounts }),
        ...(password && { password: hashedPassword }),
        ...(banner && { banner }),
      },
      { new: true, runValidators: true },
    ).lean();

    if (!patchedShop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.status(200).json({
      status: "success",
      data: patchedShop,
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
